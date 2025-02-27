import {
  describe,
  expect,
  setSystemTime,
  test,
  beforeAll,
  afterAll,
  spyOn,
  beforeEach,
  afterEach,
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

  test('handles URL with hash', () => {
    const url = 'https://example.com/article#section1';
    const baseDir = '/output';

    const filePath = generateFilePath(url, baseDir);

    expect(filePath).toBe('/output/example.com/article_section1.md');
  });

  test('handles URL with query parameters and hash', () => {
    const url = 'https://example.com/article?id=123#section2';
    const baseDir = '/output';

    const filePath = generateFilePath(url, baseDir);

    expect(filePath).toBe('/output/example.com/article_id_123_section2.md');
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
    tempDir = await mkdtemp(join(tmpdir(), 'fetchmd-test-'));
  });

  afterAll(() => {
    spyFetch.mockRestore();
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true });
  });

  beforeEach(() => {
    spyFetch.mockReset();
  });
  test('fetches article and saves as markdown', async () => {
    spyFetch.mockImplementation(mockFetchArticle);

    await program.parseAsync([
      'node', // dummy argv[0]
      'fetchmd', // dummy argv[1]
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

  test('overwrites when file exists and --overwrite option is provided', async () => {
    spyFetch.mockImplementation(mockFetchArticle);

    // Create file beforehand
    const outputPath = join(tempDir, 'example.com/article.md');
    await Bun.write(outputPath, 'existing content');

    await program.parseAsync([
      'node',
      'fetchmd',
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
    // Prepare different responses for two URLs
    const mockFetchArticle: typeof fetch = (url) => {
      const content = url.toString().includes('article2')
        ? `<!DOCTYPE html>
          <html>
            <head><title>Second Article</title></head>
            <body>
              <main>
                <h1>Second Article Headline</h1>
                <p>This is the second article content.</p>
              </main>
            </body>
          </html>`
        : `<!DOCTYPE html>
          <html>
            <head><title>Test Article</title></head>
            <body>
              <main>
                <h1>Article Headline</h1>
                <p>This is a test article content.</p>
              </main>
            </body>
          </html>`;
      return Promise.resolve(
        new Response(content, {
          headers: { 'Content-Type': 'text/html' },
        })
      );
    };
    spyFetch.mockImplementation(mockFetchArticle);

    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', {
      value: false,
      configurable: true,
    });

    const originalStdin = Bun.stdin;
    const mockStdin = new File(
      ['https://example.com/article\nhttps://example.com/article2\n'],
      'stdin'
    );
    Object.defineProperty(Bun, 'stdin', {
      value: mockStdin,
      writable: true,
    });

    await program.parseAsync(['node', 'fetchmd', '--output-dir', tempDir]);

    // Restore original values
    Object.defineProperty(process.stdin, 'isTTY', {
      value: originalIsTTY,
      configurable: true,
    });
    Object.defineProperty(Bun, 'stdin', {
      value: originalStdin,
      writable: true,
    });

    // Verify both files were generated
    const outputPath1 = join(tempDir, 'example.com/article.md');
    const outputPath2 = join(tempDir, 'example.com/article2.md');

    const content1 = await Bun.file(outputPath1).text();
    const content2 = await Bun.file(outputPath2).text();

    // Verify first file contents
    expect(content1).toContain('# Article Headline');
    expect(content1).toContain('This is a test article content.');

    // Verify second file contents
    expect(content2).toContain('# Second Article Headline');
    expect(content2).toContain('This is the second article content.');
  });
});
