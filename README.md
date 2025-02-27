# fetchmd

CLI tool that fetches a web page, extracts its main content, and saves it as Markdown.

## Installation

### Method 1: Use the install script (recommended)

#### Linux/macOS

```bash
curl -fsSL https://raw.githubusercontent.com/hushin/fetchmd/main/scripts/install.sh | bash
```

#### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/hushin/fetchmd/main/scripts/install.ps1 | iex
```

### Method 2: Manually download the binary

[Releases](https://github.com/hushin/fetchmd/releases/latest) page from which you can download the binary for your platform.

#### Linux/macOS

```bash
# Download (Example: for Linux x64)
curl -L https://github.com/hushin/fetchmd/releases/download/v1.0.0/fetchmd-linux-x64 -o fetchmd
# Grant execution permission
chmod +x fetchmd
# Move to a directory included in your PATH
mv fetchmd ~/.local/bin/
```

#### Windows

Download the .exe file, place it in a directory included in your PATH, or run it directly.

## Usage

```bash
fetchmd [URL] [options]
```

### Options

| Option                   | Description                                           |
| ------------------------ | ----------------------------------------------------- |
| `-o, --output-dir <dir>` | Specify the output directory (default: ./ref-docs)    |
| `--overwrite`            | Overwrite existing files                              |
| `-i, --input <file>`     | Input file containing URLs (one per line)             |
| `--user-agent <string>`  | Custom User-Agent header (default: fetchmd/[version]) |
| `--timeout <number>`     | Request timeout in seconds (default: 30)              |
| `-h, --help`             | Display help                                          |
| `-v, --version`          | Display version                                       |

### Examples

```bash
# Process a single URL
fetchmd https://example.com/article

# Specify the output directory
fetchmd -o ~/documents https://example.com/article

# Process multiple URLs from a file
fetchmd -i urls.txt

# Process multiple URLs from standard input (one URL per line)
cat urls.txt | fetchmd
```

### Output format

The output file will be in the following format:

- Path: `{domain}/{pathname}.md`
- Frontmatter metadata
  - title: Page title
  - url: Original URL
  - fetchDate: Date and time
  - author: Author (if available)
  - description: Description (if available)

Example:

```markdown
---
title: 'Article Title'
url: https://example.com/article
fetchDate: '2024-01-01T12:34:56.789Z'
author: 'Author Name'
description: 'Article description'
---

Content...
```

## Developer Information

### Requirements

- [Bun](https://bun.sh/) - JavaScript runtime and package manager

### Setting up the development environment

```bash
# Clone the repository
git clone https://github.com/hushin/fetchmd.git
cd fetchmd

# Install dependencies
bun install

# Run locally
bun run dev

# Build
bun run build
```

### Release procedure

1. Update the version

```bash
npm version patch # or minor, major
```

2. GitHub Actions will automatically build and release

### Technology stack

- [Bun](https://bun.sh/) - JavaScript/TypeScript runtime
- [@mozilla/readability](https://github.com/mozilla/readability) - Extracts main content from web pages
- [turndown](https://github.com/mixmark-io/turndown) - Converts HTML to Markdown
- [commander](https://github.com/tj/commander.js) - CLI interface

## License

MIT - see [LICENSE](LICENSE) for details.
