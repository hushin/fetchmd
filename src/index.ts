#!/usr/bin/env bun
import { access, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
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
  input: string | undefined;
  userAgent: string;
  timeout: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchAndParse(
  url: string,
  options: ProcessOptions
): Promise<Article> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    options.timeout * 1000
  );

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': options.userAgent,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const { document } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();
    if (!article) {
      throw new Error('Failed to parse article');
    }
    return article;
  } finally {
    clearTimeout(timeoutId);
  }
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

async function processUrl(url: string, options: ProcessOptions): Promise<void> {
  console.log(`Processing: ${url}`);
  try {
    const filePath = generateFilePath(url, options.outputDir);

    // Check if file exists
    try {
      await access(filePath);
      if (!options.overwrite) {
        console.log(`Skipping existing file: ${filePath}`);
        return;
      }
    } catch {
      // File doesn't exist, continue processing
    }

    const article = await fetchAndParse(url, options);
    const markdown = convertToMarkdown(article, url);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, markdown, 'utf-8');
    console.log(`Successfully saved: ${filePath}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Error processing ${url}: ${error.name} - ${error.message}`
      );
    } else {
      console.error(`Error processing ${url}:`, error);
    }
  }
}

async function processUrlsFromFile(
  filePath: string,
  options: ProcessOptions
): Promise<void> {
  const content = await Bun.file(filePath).text();
  const urls = content
    .split('\n')
    .filter(Boolean)
    .map((line) => line.trim());
  for (const url of urls) {
    await processUrl(url, options);
    await sleep(500); // Add 500ms delay between requests
  }
}

export function createProgram() {
  const version = require('../package.json').version;
  return program
    .name('fetchmd')
    .description('Fetch web pages and convert them to Markdown')
    .version(version)
    .argument('[url]', 'URL to fetch and convert')
    .option('-o, --output-dir <dir>', 'Output directory', 'ref-docs')
    .option('--overwrite', 'Overwrite existing files')
    .option('-i, --input <file>', 'Input file containing URLs (one per line)')
    .option(
      '--user-agent <string>',
      'Custom User-Agent header',
      `fetchmd/${version}`
    )
    .option('--timeout <number>', 'Request timeout in seconds', '30')
    .action(async (url: string | undefined, options: ProcessOptions) => {
      if (options.input) {
        await processUrlsFromFile(options.input, options);
      } else if (!url && process.stdin.isTTY) {
        console.error(
          'Error: Please provide a URL, input file, or pipe URLs through stdin'
        );
        process.exit(1);
      } else if (!url) {
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
