---
title: hygen/Jest/Storybookでテストカバレッジが自然と上がっていく開発環境作り
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Jest', 'Storybook', 'hygen', 'frontend']
published: true
---

最近コンポーネントを作る時は hygen のテンプレートをもとに一気に、コンポーネント・SCSS・Storybook・テストコードを作成するようにしています。

hygen はテンプレートをもとにコードを作成できるツールで hygen を使うことで、もともと書こうとならないとテストを書いていなくテストカバレッジが 50％ほどだったプロジェクトで、テストカバレッジを 80％ほどまで上げることができました。

また、Storybook と Jest を連動させることで、テストをメンテナンスする工数を減らしつつ、ストーリー・テストを増やすことができました。


## hygenでテンプレートをもとに必要なファイルを自動生成


hygen は下記の記事で知り、こちらで作成しているテンプレートをもとに少しカスタマイズしたものをを使用しています。

https://zenn.dev/takepepe/articles/hygen-template-generator


`yarn new:fc` でこちらの記事同様に Story・テスト・scss ファイルを一気に生成できるようにしているので、Story・テストを作るまでのハードルを下げることができ、Story・テストを作ることを強制していくことができます。

```bash
├── Button.module.scss
├── Button.spec.tsx
├── Button.story.tsx
├── Button.tsx
```

また、作られていない場合こう作ればいいという道筋がテンプレート化されているので PR レビューで、Story・テストがない場合はこのように作って欲しいと作ってと言いやすいです。

## テンプレートをもとにpropsを編集するだけでStoryを作れるように

テンプレートをもとに、  `Sample` というコンポーネントを作成した場合下記まで自動生成されるので、基本的に props を正しいものにするだけで Story が動きます。

```typescript
import * as React from 'react'
import { expect, jest } from '@storybook/jest'
import { ComponentMeta, ComponentStory } from '@storybook/react'
import { userEvent, within } from '@storybook/testing-library'
import { waitFor } from '@testing-library/react'

import { Sample } from './Sample'

export default {
  title: 'atoms/Sample',
  component: Sample,
} as ComponentMeta<typeof Sample>

const base = {
}

const PrimaryTemplate: ComponentStory<typeof Sample> = additionalProps => {
  const props = { ...base, ...additionalProps }
  return (
    <Sample {...props} />
  )
}
export const Primary = PrimaryTemplate.bind({})
Primary.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(async () => {
    await userEvent.click(canvas.getByRole('button', { name: '編集' }))
  })
}
```

また、今回はシンプルな 1 つのコンポーネントだけを扱っていますが、例えば context の注入が必要な場合などは最初からテンプレートに組み込んでしまって、不要な場合は消していくようにすると個人的には運用が楽になりました。

後から欲しい物を追加するよりも消すほうが個人的には楽なので、このようにボタンクリックという必ずしも必要ではないものまでテンプレートに最初からいれています。


## テンプレートをメンテナンスしていくことで、なるべく新しい書き方に追従できる

例えば、Storybook はバージョンによって推奨される書き方が変わることがあるので、テンプレートを最新の書き方にすることで最新の書き方に追従していきやすい環境を作ることができます。

既存のコードのコピー&ペーストをベースにして作ってしまうと古い好ましくない書き方をベースにしてしまうことがありますが、テンプレートをメンテナンスしていくことで今好ましい書き方をし続けることができます。

## StorybookのPlay functionでシナリオテストでテストを完結させる


`Play function`を使用することで、シナリオテストを作成できるので、下記のようにフォームに入力・送信までテストできる Story を簡単に作成できます。

`@storybook/jest` という addon で Storybook の中で jest のようにモックや assertion を書くこともできるので、Storybook でコンポーネントに関するテストは完結できます。

また、簡単なテストケースであれば jsdom 上でデバッグしていくことができますが、Storybook でテストを実行しているのでブラウザ上でもテストを実行し devtool で詳しい状態を見ることができるので、複雑なシナリオのテストでもこれまでより大幅に書きやすくなりました。

```typescript
export default {
  title: 'templates/Top',
  component: Top,
} as ComponentMeta<typeof Top>

const base = {
  submit: jest.fn(),
}

const PrimaryTemplate: ComponentStory<typeof Top> = additionalProps => {
  base.submit.mockClear()
  const props = { ...base, ...additionalProps }
  return <Top {...props} />
}
export const Primary = PrimaryTemplate.bind({})
Primary.play = async ({ canvasElement }) => {
  const canvas = within(canvasElement)
  await waitFor(async () => {
    await userEvent.type(canvas.getByLabelText('First Name'), 'LeBron')
    await userEvent.type(canvas.getByLabelText('Last Name'), 'James')
    await userEvent.click(canvas.getByRole('button', { name: 'submit' }))
  })
  expect(base.submit).toHaveBeenCalledWith({
    firstName: 'LeBron',
    lastName: 'James',
  })
  expect(base.submit).toHaveBeenCalledTimes(1)
}
```
コード全文はこちら。

https://github.com/YasushiKobayashi/samples/blob/master/src/next-sample/src/templates/Top/Top.story.tsx


## StoryをJestで再利用

Jest はこのように Story を import して実行できるので、最低限のテストだとこれだけでテストを実行できます。

Story に書いているコードが失敗する場合はもちろんテストが失敗しますし、テストカバレッジにも含まれるので Story をメンテナンスして、Jest に取り込んで実行するだけで簡単に統合テストを書いていくことができます。

```typescript
import { composeStories } from '@storybook/testing-react'
import * as stories from './Top.story'

const { Primary } = composeStories(stories)

describe('templates/Top', () => {
  it('Snap Shot', async () => {
    const { container } = render(<Primary />)
    await Primary.play({ canvasElement: container })
  })
```

コード全文はこちら。

https://github.com/YasushiKobayashi/samples/blob/master/src/next-sample/src/templates/Top/Top.spec.tsx


このように hygen のテンプレートで Story・テストを作りやすい環境を作ることで、最低限の Story・テストは必ず書くようになりテストカバレッジを向上させることができました。

そして、`Play function`を使うことで Story だけをメンテナンスしていけばいい状態を作り、Story・テストを両方メンテナンスしていかなければならない状態を避けて、テストコードのメンテナンス工数を削減できました。

参考記事はこちら。

https://storybook.js.org/docs/react/writing-stories/play-function
https://storybook.js.org/addons/@storybook/addon-jest
https://zenn.dev/takepepe/articles/hygen-template-generator
https://zenn.dev/azukiazusa/articles/df307292037265


今回サンプルコードにした内容は全てこちらの PR で作成しており、すべて動作確認可能です。
https://github.com/YasushiKobayashi/samples/pull/770


今回作成した Storybook はこちらで確認可能です。

https://63a2ccbc02057acaa94592e7-hslgpasccm.chromatic.com/?path=/story/atoms-inputform--primary
