#!/usr/bin/env bun
import { program } from 'commander';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';

interface Article {
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
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) {
    throw new Error('Failed to parse article');
  }
  return article;
}

function convertToMarkdown(article: Article, url: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  const frontmatter = [
    '---',
    `title: "${article.title || '(none)'}"`,
    `url: ${url}`,
    `fetchDate: "${new Date().toISOString()}"`,
    article.byline ? `author: "${article.byline}"` : null,
    article.excerpt ? `description: "${article.excerpt}"` : null,
    '---',
    '',
  ]
    .filter(Boolean)
    .join('\n');

  const markdown = turndownService.turndown(article.content);
  return `${frontmatter}\n${markdown}`;
}

function generateFilePath(url: string, baseDir: string): string {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const pathname = urlObj.pathname.endsWith('/')
    ? urlObj.pathname + 'index'
    : urlObj.pathname;

  // Convert URL components to safe filename
  const sanitizedPath = pathname
    .replace(/\//g, '_')
    .replace(/[?#&=.]/g, '_')
    .replace(/^_/, '') // 先頭のアンダースコアを削除
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
      // File doesn't exist, continue
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

async function main() {
  program
    .name('mdfetcher')
    .description('Fetch web pages and convert them to Markdown')
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
        // Handle stdin input
        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        for await (const line of rl) {
          const trimmedUrl = line.trim();
          if (trimmedUrl) {
            await processUrl(trimmedUrl, options);
          }
        }
      } else {
        await processUrl(url, options);
      }
    });

  await program.parseAsync();
}

main().catch(console.error);
