#!/usr/bin/env bun
import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { Readability } from '@mozilla/readability';
import { program } from 'commander';
import { parseHTML } from 'linkedom';
import TurndownService from 'turndown';

export interface Article {
  title: string;
  content: string;
  textContent: string;
  length: number;
  excerpt: string;
  byline: string;
  dir: string;
  siteName: string;
}

interface ProcessOptions {
  outputDir: string;
  overwrite: boolean | undefined;
  skip: boolean | undefined;
}

async function fetchAndParse(url: string): Promise<Article> {
  const response = await fetch(url);
  const html = await response.text();
  const { document } = parseHTML(html);
  const reader = new Readability(document);
  const article = reader.parse();
  if (!article) {
    throw new Error('Failed to parse article');
  }
  return article;
}

export function convertToMarkdown(article: Article, url: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  const frontmatter = [
    '---',
    `title: "${article.title?.replace(/"/g, '\\"') || '(none)'}"`,
    `url: ${url}`,
    `fetchDate: "${new Date().toISOString()}"`,
    article.byline ? `author: "${article.byline.replace(/"/g, '\\"')}"` : null,
    article.excerpt
      ? `description: "${article.excerpt.replace(/"/g, '\\"')}"`
      : null,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const markdown = turndownService.turndown(article.content);
  return `${frontmatter}\n\n${markdown}`;
}

export function generateFilePath(url: string, baseDir: string): string {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const pathname = urlObj.pathname.endsWith('/')
    ? `${urlObj.pathname}index`
    : urlObj.pathname;

  const query = urlObj.search
    ? urlObj.search.slice(1).replace(/[=&]/g, '_')
    : '';

  const hash = urlObj.hash ? `_${urlObj.hash.slice(1)}` : '';

  // Convert URL components to safe filename
  const sanitizedPath = `${pathname}${query ? `_${query}` : ''}${hash}`
    .replace(/\//g, '_')
    .replace(/[?#.]/g, '_')
    .replace(/^_/, '')
    .slice(0, 200);

  return join(baseDir, domain, `${sanitizedPath}.md`);
}

async function askUser(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer = await new Promise<string>((resolve) => {
    rl.question(`${question} (y/n): `, resolve);
  });

  rl.close();
  return answer.toLowerCase() === 'y';
}

async function processUrl(url: string, options: ProcessOptions): Promise<void> {
  try {
    const filePath = generateFilePath(url, options.outputDir);

    // Check if file exists
    try {
      await access(filePath);
      if (options.skip) {
        console.log(`Skipping existing file: ${filePath}`);
        return;
      }
      if (options.overwrite === undefined) {
        const shouldOverwrite = await askUser(
          `File ${filePath} already exists. Overwrite?`
        );
        if (!shouldOverwrite) {
          console.log('Skipping...');
          return;
        }
      } else if (!options.overwrite) {
        console.log(`Skipping existing file: ${filePath}`);
        return;
      }
    } catch {
      // File doesn't exist, continue processing
    }

    const article = await fetchAndParse(url);
    const markdown = convertToMarkdown(article, url);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, markdown, 'utf-8');
    console.log(`Successfully saved: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${url}:`, error);
  }
}

export function createProgram() {
  return program
    .name('mdfetcher')
    .description('Fetch web pages and convert them to Markdown')
    .version(require('../package.json').version)
    .argument('[url]', 'URL to fetch and convert')
    .option('-o, --output-dir <dir>', 'Output directory', process.cwd())
    .option('--overwrite', 'Overwrite existing files')
    .option('--skip', 'Skip existing files')
    .action(async (url: string | undefined, options: ProcessOptions) => {
      if (!url && process.stdin.isTTY) {
        console.error('Error: Please provide a URL or pipe URLs through stdin');
        process.exit(1);
      }

      if (!url) {
        // Handle stdin input using console AsyncIterable
        // https://bun.sh/guides/process/stdin
        for await (const line of console) {
          const trimmedUrl = line.trim();
          if (trimmedUrl) {
            await processUrl(trimmedUrl, options);
          }
        }
      } else {
        await processUrl(url, options);
      }
    });
}

async function main() {
  const program = createProgram();
  await program.parseAsync();
}

if (import.meta.main) {
  main().catch(console.error);
}
