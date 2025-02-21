# mdfetcher

URL を渡して Markdown 形式に変換して保存する CLI ツール

## インストール

### 方法 1: インストールスクリプトを使う（推奨）

```bash
curl -fsSL https://raw.githubusercontent.com/hushin-sandbox/mdfetcher/main/scripts/install.sh | bash
```

### 方法 2: 手動でダウンロード

[Releases](https://github.com/hushin-sandbox/mdfetcher/releases) ページから、お使いのプラットフォームに合ったバイナリをダウンロードしてください。

### 方法 3: ソースからビルド

```bash
bun install
bun run build
```

## 使い方

### 基本的な使い方

```bash
# 単一のURLを処理
mdfetcher https://example.com/article

# 出力先ディレクトリを指定
mdfetcher -o ~/documents https://example.com/article

# 標準入力から複数のURLを処理（1行1URL）
cat urls.txt | mdfetcher
```

**注意**: URL の指定か標準入力のいずれかが必要です。どちらも指定がない場合はエラーになります。

### オプション

- `-o, --output-dir <dir>` - 出力先ディレクトリを指定（デフォルト: カレントディレクトリ）
- `--overwrite` - 既存ファイルを上書き
- `--skip` - 既存ファイルをスキップ

### 出力ファイル

- 出力ファイルは `{domain}/{pathname}.md` の形式で保存されます
- ファイル名は URL のパス部分から自動生成されます
  - スラッシュはアンダースコアに変換
  - クエリパラメータやハッシュは安全な文字に変換
  - 最大 200 文字でカット
- frontmatter で以下の情報を保持します
  - title: ページタイトル（取得できない場合は `(none)`）
  - url: 元の URL
  - fetchDate: 取得日時
  - author: 著者（取得できる場合のみ）
  - description: 説明（取得できる場合のみ）
