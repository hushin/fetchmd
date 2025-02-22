import { describe, expect, setSystemTime, test } from 'bun:test';
import type { Article } from './index';

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
