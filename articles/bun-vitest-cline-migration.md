---
title: bun/vitestへの移行をClineで行ってみた
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['bun', 'vite', 'vitest', 'cline']
published: true
---

# はじめに

このリポジトリでは、記事とサンプルコードを 1 つのモノレポで管理し、継続的にメンテナンスしてきました。これにより、サンプルコードが現在も動作するかどうかを確認しやすくしていました。

しかし、今後採用される可能性が低い技術のバージョンアップなどのメンテナンスには工数をかけたくないため、いくつかのサンプルコードを削除しました。また、最近よく採用している技術スタックである bun/vite などへ移行しました。

この記事では、AI コーディングアシスタント「Cline」を使って行った bun と vitest への移行作業について紹介します。Cline は、コード変更の提案や実装を自動化してくれるツールで、今回のような移行作業を効率的に進めるのに役立ちました。

# bunへの移行

## 基本的な移行手順

bun への移行は非常にシンプルで、基本的には以下のコマンドだけで完了します：

```bash
$ rm -rf yarn.lock node_modules
$ bun install
```

これだけで bun への移行自体は完了しますが、より効率的に使うためにコマンド名の変更なども行いました。

## bunへの移行メリット

bun への移行によって得られた主なメリットは以下の通りです：

- **インストール速度の大幅な向上**: yarnv1 ではキャッシュを使用しても 1 分半ほどかかっていたインストールが、bun ではキャッシュなしでも数秒で完了するようになりました
- **シンプルな設定**: bun はゼロコンフィグで動作するため、設定ファイルの管理が簡単になりました
- **TypeScriptのネイティブサポート**: 追加の設定なしで TypeScript を実行できます

詳細な移行手順やその他のメモは、以下の PR とスクラップで確認できます：

- https://github.com/YasushiKobayashi/samples/pull/1068
- https://zenn.dev/ptpadan/scraps/8a03ecd391295e

## Clineを使ったbunへの移行作業

初めて Cline を使用しましたが、エディターだけでは手間のかかる置換作業などを一度に自動化できることがわかりました。また、作業内容を簡潔にまとめてもらうこともできます。

> Clineは以下の作業を自動化してくれました：
> 
> 1. **package.jsonファイルの更新**
>    - yarnコマンドをbunコマンドに置き換え
>    - `yarn` → `bun run`
>    - `yarn fix:ts` → `bun run fix-ts`
> 
> 2. **lerna.jsonの設定更新**
>    - `"npmClient": "yarn"` → `"npmClient": "bun"`
>    - `"npmClientArgs": ["--no-lockfile"]` を削除
>    - `"useWorkspaces": true` を追加
> 
> 3. **Makefileの更新**
>    - yarnコマンドをbunコマンドに置き換え
>    - `yarn build:modules` → `bun run build-modules`
> 
> 4. **GitHub Actionsワークフローの更新**
>    - yarnキャッシュ関連の設定をbunに変更
>    - yarnコマンドをbunコマンドに置き換え
> 
> 5. **コマンド名の形式変更**
>    - コロン区切りからハイフン区切りに変更
>    - `test:ci` → `vitest-ci`
>    - `type-check:watch` → `type-check-watch`
>    - `lint:ts` → `lint-ts`
> 
> 6. **テスト関連コマンドの名前変更**
>    - bunのデフォルトテストコマンドとの競合を回避
>    - `test` → `vitest`
>    - `test:ci` → `vitest-ci`
>    - `test:watch` → `vitest-watch`
> 
> これらの変更により、プロジェクト全体がbunを使用するように統一され、コマンド名の一貫性も確保されました。


# vitestへの移行

## 基本的な移行手順

Jest から vitest への移行は方法が確立されており、非常に簡単です。最低限の移行だけなら、ほぼ設定も不要です。今回行った基本的な作業は以下の通りです：

- `jest-axe` の代わりに `vitest-axe` をインストール
  - [vitest-axe GitHub](https://github.com/chaance/vitest-axe)
- コードカバレッジ用のプラグイン追加（`@vitest/coverage-istanbul`）

## vitestのメリット

Jest から vitest への移行には以下のようなメリットがあります：

- **シンプルな設定**: Jest 設定は肥大化しやすく、カスタマイズできる人も限られていましたが、vitest では設定がかなりシンプルになります
- **Viteとの統合**: Vite プロジェクトとシームレスに統合できます
- **高速な実行**: Vite の高速な HMR の恩恵を受けられます
- **安定性**: これまでの運用経験から、テストが壊れにくく非常に運用しやすいです
- **TypeScriptサポート**: TypeScript のサポートが優れています

## Clineを使ったvitestへの移行作業

vitest の移行は、まず設定ファイルを手動で作成し、1 つのディレクトリを手動で移行しました。具体的には、`vitest.config.ts`と`vitest-setup.tsx`を作成し、1 つのプロジェクトのテストファイルを更新して動作確認を行いました。

テストファイルの移行では、主に以下のような変更が必要でした：
- import パスの更新（`jest`→`vitest`）
- テストユーティリティの更新（`jest-axe`→`vitest-axe`）
- 一部のテスト構文の調整

最初のディレクトリでの移行が成功したことを確認した後、残りのディレクトリはその手動移行を参考にして Cline に移行作業を行ってもらいました。Cline は最初のディレクトリの変更パターンを学習し、他のディレクトリにも同様の変更を適用してくれました。

今回のような単純な置き換え作業は、Cline に任せることで大幅な工数削減ができました。最終チェックだけ人間が行えば良いので、効率的に移行を進めることができました。

## vitestの設定例

Jest と比較して、vitest の設定は非常にシンプルになりました。以下は実際に使用している設定例です：

```typescript
// vitest.config.ts
import { codecovVitePlugin } from '@codecov/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig(async () => {
  // why esmのエラーが出るため遅延ロードを行う
  const tsconfigPaths = (await import('vite-tsconfig-paths')).default
  return {
    plugins: [
      react(),
      tsconfigPaths(),
      codecovVitePlugin({
        enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
        bundleName: 'samples',
        uploadToken: process.env.CODECOV_TOKEN,
      }),
    ],
    test: {
      globals: true,
      environment: 'happy-dom',
      setupFiles: '../../vitest-setup.tsx',
      autoResetMocks: true,
      coverage: {
        provider: 'istanbul',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
```

また、テスト環境のセットアップファイルも非常にシンプルです：

```typescript
// vitest-setup.tsx
import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

import 'vitest-axe/extend-expect'
import 'vitest-canvas-mock'

expect.extend(matchers)
```

これにより、Jest と比較してより簡潔で理解しやすい設定となり、メンテナンス性が大幅に向上しました。

# まとめ

bun/vitest への移行は、予想以上に簡単でスムーズでした。特に以下のメリットを実感しています：

1. **開発環境の高速化**: bun によるパッケージインストールの高速化
2. **設定の簡素化**: vitest によるテスト設定の簡素化
3. **メンテナンス性の向上**: シンプルな設定によるメンテナンスの容易さ

## 移行時の課題と解決策

移行中にいくつかの課題も発生しましたが、比較的簡単に解決できました：

- **ESMの互換性**: 一部のモジュールで ESM の互換性の問題が発生しましたが、`vitest.config.ts`で遅延ロードを行うことで解決しました
- **型定義の拡張**: vitest の型定義を拡張して`vitest-axe`のマッチャーを統合する必要がありましたが、`vitest.d.ts`ファイルを作成することで解決しました
- **テスト環境の違い**: Jest と Vitest ではテスト環境に若干の違いがありましたが、`happy-dom`を使用することでほとんどのテストがそのまま動作しました

## Clineの活用効果

Cline を使用することで、複数のファイルにまたがる変更や置換作業を効率的に行うことができました。特に以下の点で効果を感じました：

- **作業時間の短縮**: 手動で行うと数時間かかる作業が数分で完了
- **ミスの削減**: 人間が行うと見落としがちな細かい変更も正確に実施
- **一貫性の確保**: すべてのファイルで同じパターンの変更を一貫して適用

詳細な移行手順やその他のメモは、以下の PR とスクラップで確認できます：

https://github.com/YasushiKobayashi/samples/pull/1068
https://zenn.dev/ptpadan/scraps/8a03ecd391295e
https://github.com/YasushiKobayashi/samples/pull/1079
