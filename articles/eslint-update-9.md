---
title: ESLint 9へのアップデートとFlat Config移行の実践記録
emoji: "🔧"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['eslint', 'typescript', 'javascript', 'linter', 'monorepo']
published: true
---

# はじめに

ESLint 9 がリリースされ、新しい Flat Config 形式が標準となりました。
この記事では、モノレポ環境での ESLint 8 から 9 へのアップデート作業と、従来の`.eslintrc.yml`形式から Flat Config 形式への移行について、実際に遭遇した問題と解決方法を含めて記録します。

# ESLint 9のメリット

ESLint 9 への移行には以下のメリットがあります。

- **パフォーマンスの向上**: 設定の解析が高速化
- **依存関係の簡素化**: 多くのプラグインが統合され、設定が簡単に

# 移行前の状況

移行前は以下の環境でした。

- ESLint 8.57.1
- `.eslintrc.yml`形式の設定ファイル
- 複数のプラグインを個別に管理

```yaml
# .eslintrc.yml（抜粋）
extends:
  - airbnb
  - eslint:recommended
  - plugin:@typescript-eslint/eslint-recommended
  - plugin:@typescript-eslint/recommended
```

# 移行手順

## 1. パッケージのアップデート

まず、ESLint 9 と関連パッケージを最新版にアップデートします。

```bash
# ESLint 9と基本パッケージのインストール
bun add -D eslint@latest @eslint/js@latest typescript-eslint@latest

# プラグインの最新版インストール
bun add -D eslint-plugin-react@latest \
  eslint-plugin-react-hooks@latest \
  eslint-plugin-jsx-a11y@latest \
  eslint-plugin-import@latest \
  eslint-plugin-simple-import-sort@latest \
  eslint-plugin-prettier@latest \
  eslint-config-prettier@latest \
  eslint-import-resolver-typescript@latest
```

## 2. Flat Config形式への移行

`.eslintrc.yml`を削除し、新しい`eslint.config.mjs`を作成します。
この移行は Claude Code や GPT で行うとかなりスムーズに進められる感じがしています。
自分の場合は Claude Code でベース移行を進めました。すぐ移行できるものはそのまま移行し、動かないものはコメントアウトしてもらいました。その後 GPT に動かし方を聞きながら進めることで、既存よりルールを落とすことなく動作させることができました。

```javascript
// eslint.config.mjs
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
// ... その他のインポート

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      // ... その他の無視パターン
    ],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: { jsx: true },
      },
    },
    // ... 設定の続き
  },
]
```

## 3. 主な変更点

### コマンドラインオプションの変更

ESLint 9 では、いくつかのコマンドラインオプションが廃止されました。

```json
// package.json
// 変更前
"lint-ts": "eslint --ext js --ext jsx --ext ts --ext tsx ./ --ignore-path .gitignore"

// 変更後
"lint-ts": "eslint ."
```

### 削除されたルール

ESLint 9 で削除されたルールがあります。

- `valid-jsdoc`: 削除されたため、設定から除外

### 新しいルール

TypeScript ESLint で新しく追加されたルール。

- `@typescript-eslint/no-empty-object-type`: 空のオブジェクト型に対する警告

# 実装のポイント：Light/Fullモード

## モード切り替えの背景

TypeScript ESLint では、`parserOptions.project: true` を設定することで、型情報を使った詳細なリントが可能になります。しかし、この設定には以下の課題があります。

- **パフォーマンスの問題**: 型チェックのため実行速度が大幅に低下
- **メモリ使用量の増大**: 大規模なモノレポでは特に顕著
- **メモリ不足によるクラッシュ**: Node.js のメモリ制限を超えて ESLint が異常終了する
- **開発効率の低下**: 保存のたびに重いリントが実行される

この問題を解決するため、自分が実際に運用しているプロダクトでは、環境変数で Light モードと Full モードを切り替える実装をしています。

## 実装の詳細

```javascript
const isLightMode = process.env.ESLINT_LIGHT_MODE === 'true'
console.log(`ESLint running in ${isLightMode ? 'LIGHT' : 'FULL'} mode`)

// Lightモード：高速な基本チェック
const lightModeConfig = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: false,  // 型情報を使わない
        ecmaFeatures: { jsx: true }
      },
    },
    rules: {
      // 基本的なルールのみ
      '@typescript-eslint/no-unused-vars': 0,
      '@typescript-eslint/no-explicit-any': 0,
    },
  },
]

// Fullモード：完全な型チェックを含む詳細な検証
const fullModeConfig = [
  {
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,  // 型情報を使用
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // 型情報を使った詳細なルール
      'import/no-unresolved': 2,
      '@typescript-eslint/explicit-function-return-type': 1,
    },
  },
]

export default isLightMode ? lightModeConfig : fullModeConfig
```

## 使い分けの戦略

### Lightモード（開発時）
```bash
ESLINT_LIGHT_MODE=true bun run lint-ts
```

- **用途**: 開発中のリアルタイムチェック、エディタ統合
- **特徴**: 高速実行、最低限のルール、型情報不要
- **メリット**: 開発効率を損なわない、保存時の快適性

### Fullモード（CI/本格チェック）
```bash
# 環境変数なし（デフォルト）
bun run lint-ts
```

- **用途**: CI/CD、プルリクエスト前の最終チェック
- **特徴**: 完全な型チェック、すべてのルール適用
- **メリット**: 高品質なコード品質保証、型安全性の確保

この設計により、開発中は高速な Light モードで、CI では詳細な Full モードでチェックできます。

# トラブルシューティング

## 1. 削除されたルール

ESLint 9 では以下のルールが削除されました。

```javascript
// 削除されたルール
'valid-jsdoc': 2  // ESLint 9 で削除
```

これらのルールは設定から削除する必要があります。

## 2. 新しく追加されたルール

TypeScript ESLint で新しいルールが追加されました。

```javascript
// 新しいルール
'@typescript-eslint/no-empty-object-type': 0  // 空のオブジェクト型に対する警告
```

## 3. importプラグインのResolver設定

Flat Config での import プラグインの設定は、従来とは異なる形式になります。

```javascript
settings: {
  'import/resolver': {
    typescript: {
      alwaysTryTypes: true,
      project: ['./tsconfig.json', './src/*/tsconfig.json'],
    },
    node: true,
  },
}
```

## 4. コマンドラインオプションの変更

ESLint 9 では多くのコマンドラインオプションが廃止されました。

```json
// package.json
// 変更前
"lint-ts": "eslint --ext js --ext jsx --ext ts --ext tsx ./ --ignore-path .gitignore"

// 変更後（シンプルに！）
"lint-ts": "eslint ."
```

`--ext`や`--ignore-path`オプション不要になり、すべて Flat Config 内で設定します。

# パフォーマンス最適化

## メモリ不足への対策

ある程度の規模のモノレポでは、ESLint がメモリ不足でクラッシュする場合があります。以下の対策が有効です。

### 1. Lightモードの活用
開発時は Light モードを使用することで、メモリ使用量を大幅に削減できます。

```bash
# 開発時
ESLINT_LIGHT_MODE=true bun run lint-ts
```

### 2. Lernaを使用した並列実行
メモリ使用量を分散させるため、ワークスペースごとに分割実行する。

```json
// package.json
"lint-ts": "lerna run --stream --parallel lint"
```

### 3. Node.jsのメモリ制限を増やす
必要に応じて Node.js のヒープサイズを拡張する。

```json
// package.json
"lint-ts-heavy": "node --max-old-space-size=4096 ./node_modules/.bin/eslint ."
```

# まとめ

ESLint 9 への移行は、最初は設定形式の変更に戸惑う場合があります。しかし、以下の点に注意すれば比較的スムーズに進められます。

1. **段階的な移行**: まずは基本的な設定から始め、徐々に詳細な設定を追加
2. **エラーメッセージの確認**: ESLint 9 は親切なエラーメッセージを表示するので、それに従って修正
3. **参考プロジェクトの活用**: 既存の成功事例を参考にすることで、実装がスムーズに

特にモノレポ環境では、Light/Full モードの実装により、開発効率とコード品質の両立が可能になりました。今後新しいプロジェクトを始める際は、最初から Flat Config 形式での設定をお勧めします。

# 参考リンク

- [ESLint 9.0.0 released](https://eslint.org/blog/2024/04/eslint-v9.0.0-released/)
- [Configuration Files (Flat Config)](https://eslint.org/docs/latest/use/configure/configuration-files)
- [typescript-eslint](https://typescript-eslint.io/)


# 実装例

今回実際に行った ESLint のアップデートによる、コードの差分・流れは以下の PR で確認できます。

https://github.com/YasushiKobayashi/samples/pull/1163