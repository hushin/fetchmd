import {
  describe,
  expect,
  setSystemTime,
  test,
  beforeAll,
  afterAll,
  spyOn,
  beforeEach,
} from 'bun:test';
import type { Article } from './index';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createProgram } from './index';

import { convertToMarkdown, generateFilePath } from './index';

describe('convertToMarkdown', () => {
  test('converts article to markdown with frontmatter', () => {
    setSystemTime(new Date('2025-02-22T08:28:43.765Z'));

    const article: Article = {
      title: 'Test Article',
      content: '<h1>Hello</h1><p>This is a test</p>',
      textContent: 'Hello This is a test',
      length: 19,
      excerpt: 'This is a test excerpt',
      byline: 'John Doe',
      dir: 'ltr',
      siteName: 'Test Site',
    };
    const url = 'https://example.com/test';

    const markdown = convertToMarkdown(article, url);

    expect(markdown).toMatchInlineSnapshot(`
      "---
      title: "Test Article"
      url: https://example.com/test
      fetchDate: "2025-02-22T08:28:43.765Z"
      author: "John Doe"
      description: "This is a test excerpt"
      ---

      # Hello

      This is a test"
    `);
  });

  test('handles article with special characters in title', () => {
    const article: Article = {
      title: 'Test "Article" with quotes',
      content: '<p>Content</p>',
      textContent: 'Content',
      length: 7,
      excerpt: '',
      byline: '',
      dir: 'ltr',
      siteName: '',
    };
    const url = 'https://example.com/test';

    const markdown = convertToMarkdown(article, url);

    expect(markdown).toContain('title: "Test \\"Article\\" with quotes"');
  });
});

describe('generateFilePath', () => {
  test('generates file path for simple URL', () => {
    const url = 'https://example.com/article';
    const baseDir = '/output';

    const filePath = generateFilePath(url, baseDir);

    expect(filePath).toBe('/output/example.com/article.md');
  });

  test('handles URL with query parameters', () => {
    const url = 'https://example.com/article?id=123&type=test';
    const baseDir = '/output';

    const filePath = generateFilePath(url, baseDir);

    expect(filePath).toBe('/output/example.com/article_id_123_type_test.md');
  });

  test('handles URL with trailing slash', () => {
    const url = 'https://example.com/article/';
    const baseDir = '/output';

    const filePath = generateFilePath(url, baseDir);

    expect(filePath).toBe('/output/example.com/article_index.md');
  });
});

describe('CLI integration', () => {
  let tempDir: string;
  const program = createProgram();

  const mockFetchArticle: typeof fetch = async (url) => {
    expect(url).toBe('https://example.com/article');
    return new Response(
      `<!DOCTYPE html>
    <html>
      <head>
        <title>Test Article</title>
      </head>
      <body>
        <main>
          <h1>Article Headline</h1>
          <p>This is a test article content.</p>
        </main>
      </body>
    </html>`,
      {
        headers: { 'Content-Type': 'text/html' },
      }
    );
  };

  const spyFetch = spyOn(globalThis, 'fetch');

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'mdfetcher-test-'));
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true });
    spyFetch.mockRestore();
  });

  beforeEach(() => {
    spyFetch.mockReset();
  });
  test('fetches article and saves as markdown', async () => {
    spyFetch.mockImplementation(mockFetchArticle);

    await program.parseAsync([
      'node', // dummy argv[0]
      'mdfetcher', // dummy argv[1]
      'https://example.com/article',
      '--output-dir',
      tempDir,
    ]);

    // Read the generated file and verify its contents
    const outputPath = join(tempDir, 'example.com/article.md');
    const content = await Bun.file(outputPath).text();

    expect(content).toContain('# Article Headline');
    expect(content).toContain('This is a test article content.');
    expect(spyFetch).toHaveBeenCalledTimes(1);
  });

  test('skips when file exists and --skip option is provided', async () => {
    spyFetch.mockImplementation(mockFetchArticle);

    // Create file beforehand
    const outputPath = join(tempDir, 'example.com/article.md');
    await Bun.write(outputPath, 'existing content');

    await program.parseAsync([
      'node',
      'mdfetcher',
      'https://example.com/article',
      '--output-dir',
      tempDir,
      '--skip',
    ]);

    // Verify the file was not overwritten
    const content = await Bun.file(outputPath).text();
    expect(content).toBe('existing content');
    expect(spyFetch).toHaveBeenCalledTimes(0);
  });

  test('overwrites when file exists and --overwrite option is provided', async () => {
    spyFetch.mockImplementation(mockFetchArticle);

    // Create file beforehand
    const outputPath = join(tempDir, 'example.com/article.md');
    await Bun.write(outputPath, 'existing content');

    await program.parseAsync([
      'node',
      'mdfetcher',
      'https://example.com/article',
      '--output-dir',
      tempDir,
      '--overwrite',
    ]);

    // Verify the file was overwritten
    const content = await Bun.file(outputPath).text();
    expect(content).toContain('# Article Headline');
    expect(content).toContain('This is a test article content.');
    expect(spyFetch).toHaveBeenCalledTimes(1);
  });

  test('processes URLs from stdin', async () => {
    spyFetch.mockImplementation(mockFetchArticle);

    // process.stdin.isTTY を false にモック
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', {
      value: false,
      configurable: true,
    });
    // Bun.stdin をモック
    const originalStdin = Bun.stdin;
    const mockStdin = new File(['https://example.com/article\n'], 'stdin');
    Object.defineProperty(Bun, 'stdin', {
      value: mockStdin,
      writable: true,
    });

    await program.parseAsync(['node', 'mdfetcher', '--output-dir', tempDir]);

    // process.stdin.isTTY を元に戻す
    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });
    // Bun.stdin を元に戻す
    Object.defineProperty(Bun, 'stdin', {
      value: originalStdin,
      writable: true,
    });

    // 生成されたファイルを確認
    const outputPath = join(tempDir, 'example.com/article.md');
    const content = await Bun.file(outputPath).text();

    expect(content).toContain('# Article Headline');
    expect(content).toContain('This is a test article content.');
    expect(spyFetch).toHaveBeenCalledTimes(1);
  });
});
