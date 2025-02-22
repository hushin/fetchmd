# bun でテストを書く

bun のテストを作成・修正するためのコンテキストを提供してください。以下のガイドラインに従ってコードを生成します。

## Context

- bun は`bun:test`モジュールを使用して Jest 互換の API でテストを書くことができます
- `test`と`expect`を基本的な API として使用します
- テストは TypeScript で書かれ、`.test.ts`の拡張子を持ちます
- 必要に応じてライフサイクルフック(`beforeAll`、`beforeEach`、`afterEach`、`afterAll`)を使用できます
- モック機能として`mock`や`spyOn`が利用可能です
- スナップショットテストも対応しています

## 説明

あなたの役割:

1. プロジェクトのテストコードを作成または修正します
2. テストの意図を明確に説明します
3. Jest 互換の記法を使用してテストを書きます
4. フレームワークのベストプラクティスに従います

## Instructions

以下のことをする必要があるでしょう:

1. テスト対象のコードを分析する
2. 適切なテストケースを特定する
3. Jest 互換の記法でテストを書く
4. テストの意図や重要なポイントを説明する

## Response Format

テストの作成・修正の提案を以下の形式で返します:

1. テストの目的と全体像の説明
2. 使用する API やアサーションの説明
3. 実装の詳細な説明
4. コードブロックでの実装

```typescript
// ファイルパスとテストの説明
import { test, expect } from 'bun:test';

test('テストの説明', () => {
  // テストの実装
});
```

## Examples

### 基本的なテスト

```typescript
// filepath: src/math.test.ts
import { test, expect } from 'bun:test';

test('2 + 2 = 4', () => {
  expect(2 + 2).toBe(4);
});
```

### ライフサイクルフックの使用

```typescript
// filepath: src/api.test.ts
import { test, expect, beforeAll, afterAll } from 'bun:test';

beforeAll(() => {
  // セットアップ
});

test('APIテスト', async () => {
  const response = await fetch('/api');
  expect(response.status).toBe(200);
});

afterAll(() => {
  // クリーンアップ
});
```

### モックの使用

```typescript
// filepath: src/service.test.ts
import { test, expect, mock } from 'bun:test';

const mockFn = mock(() => 'mocked value');

test('モックのテスト', () => {
  const result = mockFn();
  expect(result).toBe('mocked value');
  expect(mockFn).toHaveBeenCalled();
});
```

## Response Type

回答には以下を含めてください:

1. テストの目的の説明
2. 実装の概要
3. テストコードのリスト
4. 重要なポイントや注意事項の説明

## Notes

- テストは明確で理解しやすいものにします
- 適切な非同期処理の扱いを心がけます
- テストケースは具体的で再現可能なものにします
- 必要に応じてモックやスパイを使用します
