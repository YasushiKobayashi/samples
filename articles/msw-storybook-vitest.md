---
title: msw-storybook-addonのMSWをvitestからも使えるようにする
emoji: '📚'
type: 'tech' # tech: 技術記事 / idea: アイデア
topics: ['msw', 'storybook', 'vitest', 'frontend']
published: true
---

Storybook で MSW を使ってモックしている API レスポンスを、vitest 側のテストでもそのまま再利用したいケースがありました。

これまで spec ファイルでは `vi.fn()` で fetch を差し替えたり、`global.fetch` をモックしたりしていましたが、Story 側で `parameters.msw.handlers` に書いているハンドラーがあるのに、vitest 側で同じ内容を別途書き直す必要があり二重管理になっていました。

`msw-storybook-addon` v2 と Storybook 8.2 以降の portable stories を組み合わせると、Story を `composeStories` で取り込むだけで Story 側の MSW ハンドラーが vitest 上でも自動的に有効になります。新しい vitest plugin を自作する必要はなく、薄いヘルパーを 1 つ用意するだけで完結しました (8.2.7 以降であれば `Story.run()` というメソッド名が使えますが、それ以前でも同等の `Story.play()` で同じ仕組みが動きます)。

## 必要なバージョン

このパターンは比較的最近のバージョン以降で動くようになったもので、少し前までは同じことを実現するのが難しい状態でした。導入を検討する場合は事前にバージョンを確認しておくのが良いです。

- **Storybook 8.2 以降**: portable stories から `mswLoader` が自動で走るようになったのは Storybook 8.2 からです。それ以前 (< 8.2) では `msw-storybook-addon` が提供する `applyRequestHandlers` というヘルパーを spec から手動で呼ぶ必要がありました
- **`Story.run({ canvasElement })` を使うなら 8.2.7 以降**: このメソッド名は 8.2.7 で導入されたもので、それ以前のマイナーバージョンでは `Story.play({ canvasElement })` という名前で同じ仕組みが動きます。本記事では `Story.run()` 前提で書いています
- **`msw-storybook-addon` v2 以降**: `parameters.msw.handlers` と `mswLoader` の API 自体は v1 系の頃から存在しています。v2 で変わったのは MSW 本体側の handler 記法対応で、v1 系では MSW v1 の `rest.get(...)` / `res(ctx.json(...))` を、v2 系では MSW v2 の `http.get(...)` / `HttpResponse.json(...)` を使う形になります
- **MSW v2 以降**: 上記の通り、本記事のサンプルコードで使っている `http.get(...)` / `HttpResponse.json(...)` は MSW v2 の API です

境界線をまとめると次の関係になります。

- ハンドラーを Story と vitest で共有できる仕組み自体: **Storybook 8.2 + msw-storybook-addon v1.x + MSW v1** から成立
- 本記事の書き方 (`Story.run()` / `http.get(...)`) をそのままなぞるなら: **Storybook 8.2.7 + msw-storybook-addon v2 + MSW v2**

## msw-storybook-addonの仕組み

`msw-storybook-addon` は package.json の `exports` で実行環境を分岐していて、`node` 条件では `msw/node` の `setupServer`、それ以外では `msw/browser` の `setupWorker` をロードします。そのため `initialize()` を 1 か所書いておくだけで、Storybook (browser) と vitest (Node) の両方で MSW が立ち上がります。

`mswLoader` は Story 実行時に `parameters.msw.handlers` を読み取り、`server.use(...)` または `worker.use(...)` でハンドラーを差し替えます。Storybook の portable stories API である `composeStories` の第 2 引数に preview を含む project annotations を渡しておくと、vitest 上で `Story.run()` を呼んだ際にも同じ loaders が走り、Story に書いた MSW ハンドラーがそのまま適用されるという流れです。

## fetchを行うサンプルコンポーネントを用意する

`/api/users/:id` を fetch する単純なコンポーネントを例にします。エラー時はメッセージ、ローディング中は `Loading...`、成功時はユーザー名とメールを表示するだけのものです。

```tsx
export const UserCard: React.FC<{ userId: number }> = ({ userId }) => {
  const [user, setUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json() as Promise<User>
      })
      .then(setUser)
      .catch((e: Error) => setError(e.message))
  }, [userId])

  if (error) return <p role="alert">読み込みに失敗しました: {error}</p>
  if (!user) return <p>Loading...</p>
  return (
    <section aria-label="user card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </section>
  )
}
```

https://github.com/YasushiKobayashi/samples/blob/main/src/msw-storybook-sample/src/UserCard/UserCard.tsx

## StoryにMSWハンドラーを書く

`parameters.msw.handlers` に MSW v2 の `http.get` を渡します。Story ごとに別ハンドラーを書けるので、成功・404 などのバリエーションを Story として並べておけます。Story を増やすほど `play function` で確認するパターンも増やせるので、後から spec を書く時に Story 側のレールに乗るだけで済みます。

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http, HttpResponse } from 'msw'
import { expect, within } from 'storybook/test'

import { UserCard } from './UserCard'

export default {
  title: 'UserCard',
  component: UserCard,
} as Meta<typeof UserCard>
type Story = StoryObj<typeof UserCard>

export const Primary: Story = {
  args: { userId: 1 },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users/:id', ({ params }) =>
          HttpResponse.json({
            id: Number(params.id),
            name: 'LeBron James',
            email: 'lebron@example.com',
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByText('LeBron James')).toBeInTheDocument()
    expect(canvas.getByText('lebron@example.com')).toBeInTheDocument()
  },
}

export const NotFound: Story = {
  args: { userId: 999 },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users/:id', async () => {
          await delay(50)
          return new HttpResponse(null, { status: 404 })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = await canvas.findByRole('alert')
    expect(alert).toHaveTextContent('読み込みに失敗しました: status 404')
  },
}
```

https://github.com/YasushiKobayashi/samples/blob/main/src/msw-storybook-sample/src/UserCard/UserCard.story.tsx

## preview.tsでMSWを初期化する

`msw-storybook-addon` の `initialize()` と `mswLoader` を preview.ts に追加します。`initialize()` は実行環境を package.json の `exports` 条件で自動判別するため、Storybook (browser) と vitest (Node) どちらでも 1 箇所でセットアップが済みます。

```ts
import type { Preview } from '@storybook/react-vite'
import { initialize, mswLoader } from 'msw-storybook-addon'

initialize({ onUnhandledRequest: 'bypass' })

const preview: Preview = {
  parameters: {
    a11y: { element: '#storybook-root', options: {}, manual: true },
  },
  loaders: [mswLoader],
  tags: ['autodocs'],
}

export default preview
```

https://github.com/YasushiKobayashi/samples/blob/main/src/msw-storybook-sample/.storybook/preview.ts

## vitest側で使うヘルパーを用意する

vitest 側で Story を取り込むためのヘルパーを `testUtils/storybookMswSetup.ts` として用意します。やっていることは `composeStories` の第 2 引数で preview を渡しているだけで、それだけで `mswLoader` を含む project annotations が Story 実行時に動く仕組みです。

`composeStories` の import 元は使っているフレームワークに合わせます。本サンプルは React + Vite で `@storybook/react-vite` を使っているのでそこから import しています。Next.js + Vite であれば `@storybook/nextjs-vite`、Vue + Vite なら `@storybook/vue3-vite` といった具合です。

```ts
import { composeStories } from '@storybook/react-vite'
import { getWorker } from 'msw-storybook-addon'
import { afterAll } from 'vitest'

import preview from '../../.storybook/preview'

export const composeStoriesWithMsw = <T extends Parameters<typeof composeStories>[0]>(stories: T) =>
  composeStories(stories, preview as Parameters<typeof composeStories>[1])

let cleanupRegistered = false
export const registerMswCleanup = () => {
  if (cleanupRegistered) return
  cleanupRegistered = true
  afterAll(async () => {
    const worker = getWorker()
    if (worker && 'close' in worker && typeof worker.close === 'function') {
      await worker.close()
    }
  })
}

interface RunnableStory {
  run: (options?: { canvasElement?: HTMLElement }) => Promise<void>
}

export const renderStory = async (Story: RunnableStory): Promise<HTMLElement> => {
  const canvasElement = document.createElement('div')
  document.body.appendChild(canvasElement)
  await Story.run({ canvasElement })
  return canvasElement
}
```

https://github.com/YasushiKobayashi/samples/blob/main/src/msw-storybook-sample/src/testUtils/storybookMswSetup.ts

`composeStories` の第 2 引数に preview をそのまま渡しているところがポイントです。Storybook 公式の portable stories docs では `setProjectAnnotations` を setupFile でグローバル登録するパターンが推奨されていて、第 2 引数は便宜的な上書き口として位置づけられています。今回の自分のプロジェクトでは既存 spec が `<Story />` JSX 直書き + 手動 Wrapper コンポーネント形式で書かれていて、グローバル登録すると preview の decorator が二重に適用されて大量のリグレッションが起きてしまったので、テストファイル単位でオプトインできるヘルパー方式に倒しています。新規プロジェクトや既存 spec が少ないプロジェクトであれば、素直に `setProjectAnnotations` を使う方が公式に沿った形になります。

## specからStoryを呼び出す

ヘルパー経由で Story を取り込み、`Story.run()` で実行します。Story 側に `play function` まで書いてあるので、spec 側はアクセシビリティチェックなど Story の外で行いたい後処理だけを書けば十分で、テストコードもかなりシンプルになります。

```tsx
import {
  composeStoriesWithMsw,
  registerMswCleanup,
  renderStory,
} from '@/testUtils/storybookMswSetup'

import * as stories from './UserCard.story'

registerMswCleanup()
const { Primary, NotFound } = composeStoriesWithMsw(stories)

describe('UserCard', () => {
  it('Primary: 取得した user 情報を表示する', async () => {
    await renderStory(Primary)
  })

  it('NotFound: 404 ならエラーメッセージを表示する', async () => {
    await renderStory(NotFound)
  })
})
```

https://github.com/YasushiKobayashi/samples/blob/main/src/msw-storybook-sample/src/UserCard/UserCard.spec.tsx

これで `bun run vitest` を実行すると、Story 側に書いた MSW ハンドラーがそのまま適用された状態で `play function` が実行され、`UserCard` の表示と 404 時のエラー表示がまとめて検証できます。Story 側で `expect` まで書いてあるので spec 側は `renderStory(Primary)` を呼ぶだけで済んでいます。

## `<Story />` JSX 直書きではなく `Story.run()` を使う

これまでは下記のように Story を JSX として直接 render し、`play` を手動で呼んでいました。

```tsx
const { Primary } = composeStories(stories)
const { container } = render(<Primary />)
await Primary.play({ canvasElement: container })
```

この書き方だと Storybook の `loaders` が走らないため、`mswLoader` も実行されず MSW ハンドラーが差し替わりません。`Story.run({ canvasElement })` を使うと loaders → decorators → render → play の順序が Storybook と同じになり、Story 側のモックがそのまま効く形になります。

`@storybook/addon-vitest` の内部実装も `Story.run()` を使っているので、Storybook 8.2.7 以降はこちらが正式な書き方として揃ってきています (8.2.7 ではメソッド名が `play` から `run` にリネームされ、`play` も互換のため残っているという経緯です)。既存の spec を書き直す時は同時に `Story.run()` 形式に寄せていくと、MSW を含めた Story 側のモックがそのまま vitest からも使えるようになります。

## vitest pluginを自作するか検討した結果不要だった

最初は vitest plugin として独自パッケージを作ることも検討していました。ただ、必要な処理は `composeStories` の第 2 引数に preview を渡すだけで完結するので、30 行程度のヘルパーを 1 つ置くだけで足りました。plugin 化したとしても `configDir` から preview を auto-resolve する程度の薄い機能しか提供できないため、社内ヘルパーとして寄せておく方を選びました。

`msw-storybook-addon` の readme や Storybook 公式が推奨している `setProjectAnnotations` を setupFile でグローバル登録するパターンは、新規プロジェクトであればそちらの方が公式準拠で素直です。今回採用しなかったのは既存事情側の理由で、既存の spec が `<Story />` JSX 直書きや手動 Wrapper コンポーネントで書かれていると、preview の decorator が二重に適用されて大量のリグレッションが起きるためです。テストファイル単位でオプトインできるヘルパー方式の方が、既存のコードに影響を出さず段階的に乗せていきやすいので今回はこちらに倒しました。

今回サンプルコードにした内容や、動作確認で使用したコードは全てこちらの PR で作成しており、すべて動作確認可能です。

https://github.com/YasushiKobayashi/samples/pull/1243

https://github.com/YasushiKobayashi/samples/tree/main/src/msw-storybook-sample

参考リンク。

https://github.com/mswjs/msw-storybook-addon
https://storybook.js.org/docs/api/portable-stories/portable-stories-vitest
https://mswjs.io/
