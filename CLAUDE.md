# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Zenn の記事とサンプルコードを 1 つのモノレポで管理しているリポジトリです。サンプルコードは常に動作する状態を維持するため継続的にメンテナンスされています。`/articles`に Zenn 記事（フロントマター付き Markdown）、`/src`にサンプルコード実装が格納されています。

## 主要コマンド

### 開発環境セットアップ

```bash
# .node-versionで指定されたNode.jsバージョンをインストール
cat .node-version | nodenv install

# Bunで依存関係をインストール
bun install
```

### テスト実行

```bash
# 全ワークスペースのテストを並列実行
bun run vitest

# CI用（カバレッジとJUnit出力付き）
bun run vitest-ci

# ウォッチモードでテスト実行
bun run vitest-watch

# 単一テストファイルの実行（ワークスペースディレクトリから）
bunx vitest path/to/test.spec.tsx
```

### 型チェックとリント

```bash
# 全ワークスペースの型チェック
bun run type-check

# ウォッチモードで型チェック
bun run type-check-watch

# TypeScript/JavaScriptファイルのリント
bun run lint-ts

# Markdown記事のリント
bun run lint-md

# 全ての問題を自動修正
bun run fix
```

### ビルドと開発

```bash
# 全ワークスペースを並列ビルド
bun run build

# Zenn記事をローカルでプレビュー
bun run start

# 開発サーバー起動（src/next-sampleなど特定ワークスペースから）
bun run dev
```

### PlaywrightでのE2Eテスト

```bash
# Playwrightブラウザをインストール
bun playwright install

# E2Eテスト実行（src/playwright-sampleから）
bun run e2e-chromium
```

## アーキテクチャ

### モノレポ構造

- Bun ワークスペースと連携した Lerna で複数パッケージを管理
- `/src`内の各サンプルプロジェクトは独立したワークスペース（独自の`package.json`を持つ）
- ルートレベルのスクリプトが全ワークスペースでの並列実行を統括

### テストアーキテクチャ

- **フレームワーク**: パフォーマンスと設定の簡素化のため Jest から Vitest へ移行
- **テスト環境**: 高速 DOM テスト用の Happy DOM
- **Reactテスト**: `@testing-library/react`と`@vitejs/plugin-react`を使用
- **アクセシビリティテスト**: 自動アクセシビリティチェック用の`vitest-axe`を統合
- **カバレッジ**: Codecov 統合付きの Istanbul プロバイダー
- **テストファイル**: 実装ファイルと同じ場所に配置（例：`Main.tsx`と`Main.spec.tsx`）

### CI/CDパイプライン

- **GitHub Actions**: main へのプッシュと PR 時の自動テスト
- **テスト実行**: リント、型チェック、ユニットテスト、end-to-end テストを実行
- **カバレッジレポート**: Codecov へ自動アップロード
- **Chromatic統合**: Storybook コンポーネントのビジュアルリグレッションテスト

### 主要な技術的決定

- **パッケージマネージャー**: 高速インストールと組み込み TypeScript サポートのため Yarn から Bun へ移行
- **テストフレームワーク**: ESM サポート改善と実行速度向上のため Jest から Vitest へ移行
- **設定**: ルートの共有 Vitest 設定とワークスペース固有のオーバーライド
- **コード品質**: ESLint と Prettier、Husky でのプリコミットフック、lint-staged での増分リント

## 最近の移行

プロジェクトは最近大規模な移行を実施：

1. **Yarn → Bun**: パッケージインストール速度の向上とスクリプトの簡素化
2. **Jest → Vitest**: TypeScript サポート改善、テスト実行高速化、設定の簡素化
3. これらの移行により設定ファイルがクリーンになり、開発体験が向上
