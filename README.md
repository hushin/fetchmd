# mdfetcher

URL を渡して Markdown 形式に変換して保存する CLI ツール。Web ページの本文を抽出し、Markdown 形式で保存します。

<!--
## インストール

### 方法 1: インストールスクリプトを使う（推奨）

```bash
curl -fsSL https://raw.githubusercontent.com/hushin-sandbox/mdfetcher/main/scripts/install.sh | bash
```

### 方法 2: 手動でバイナリをダウンロード

[Releases](https://github.com/hushin-sandbox/mdfetcher/releases/latest) ページから、お使いのプラットフォーム用のバイナリをダウンロードしてください。

#### Linux/macOS

```bash
# ダウンロード (例: Linux x64の場合)
curl -L https://github.com/hushin-sandbox/mdfetcher/releases/download/v1.0.0/mdfetcher-linux-x64 -o mdfetcher
# 実行権限を付与
chmod +x mdfetcher
# PATHの通ったディレクトリに移動
mv mdfetcher ~/.local/bin/
```

#### Windows

.exe ファイルをダウンロードし、PATH の通ったディレクトリに配置するか、直接実行してください。 -->

## 使い方

```bash
mdfetcher [URL] [オプション]
```

### オプション

| オプション               | 説明                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `-o, --output-dir <dir>` | 出力先ディレクトリを指定（デフォルト: カレントディレクトリ） |
| `--overwrite`            | 既存ファイルを上書き                                         |
| `--skip`                 | 既存ファイルをスキップ                                       |
| `-h, --help`             | ヘルプを表示                                                 |
| `-v, --version`          | バージョンを表示                                             |

### 使用例

```bash
# 単一のURLを処理
mdfetcher https://example.com/article

# 出力先ディレクトリを指定
mdfetcher -o ~/documents https://example.com/article

# 標準入力から複数のURLを処理（1行1URL）
cat urls.txt | mdfetcher
```

### 出力形式

出力されるファイルは以下の形式になります：

- パス: `{domain}/{pathname}.md`
- frontmatter 形式のメタデータ
  - title: ページタイトル
  - url: 元の URL
  - fetchDate: 取得日時
  - author: 著者（取得できる場合）
  - description: 説明（取得できる場合）

例：

```markdown
---
title: '記事タイトル'
url: https://example.com/article
fetchDate: '2024-01-01T12:34:56.789Z'
author: '著者名'
description: '記事の説明'
---

本文...
```

## 開発者向け情報

### 開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/hushin-sandbox/mdfetcher.git
cd mdfetcher

# 依存関係のインストール
bun install

# ローカルで実行
bun run index.ts

# ビルド
bun run build
```

### リリース手順

1. バージョンを更新

```bash
npm version patch # or minor, major
```

2. GitHub Actions が自動的にビルドとリリースを行います

### 技術スタック

- [Bun](https://bun.sh/) - JavaScript/TypeScript ランタイム
- [@mozilla/readability](https://github.com/mozilla/readability) - Web ページの本文抽出
- [turndown](https://github.com/mixmark-io/turndown) - HTML から Markdown への変換
- [commander](https://github.com/tj/commander.js) - CLI インターフェース

## ライセンス

MIT
