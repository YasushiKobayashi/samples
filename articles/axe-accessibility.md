---
title: axeを活用して、アクセシビリティをちゃんと理解しなくても、アクセシビリティを担保したhtmlを書く
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Jest', 'hygen', 'Playwgiht', 'axe',  'Accessibility']
published: true
---

アクセシビリティにはあまり詳しくないので、アクセシビリティ上問題があるコードを書いてしまっても気づくことがこれまでできませんでしたが、axe を使用することでアクセシビリティをある程度担保したコードを書けているかテストをできるようになりました。

`jest-axe` ・ `@axe-core/playwright`  を使用したテストを CI で回すことで、アクセシビリティを継続的に担保していくことができます。

## jest axeを活用してコンポーネントのアクセシビリティ担保

`jest-axe`を使用することでコンポーネント単位でアクセシビリティテストをできます。

コンポーネント単位でテストができることで、1 つ1つアクセシビリティ的に正しいコンポーネントを作ることができ、小さい単位でアクセシビリティの改善をしていくことができるので既存プロジェクトにも導入がしやすいです。


## jest-axe のセットアップ

まず `jest.setup.js` に axe のセットアップをします。

```typescript
import { toHaveNoViolations } from 'jest-axe'
import 'jest-axe/extend-expect'

expect.extend(toHaveNoViolations)
```

次に axe を実行するための、ラッパーの関数を用意して実行するようにしています。
自分はこちらのように axe のラッパーを用意してこのサンプルリポジトリでは、特に除外の設定をしていないですが、導入しているプロジェクトでは担保することが難しいルールを基本除外にしています。

https://github.com/YasushiKobayashi/samples/blob/master/src/next-sample/src/testUtils/axeRunner.ts

```typescript
import { configureAxe } from 'jest-axe'

export const axeRunner = configureAxe({
  rules: {
    'image-alt': { enabled: false },
    'link-name': { enabled: false },
  },
})
```


https://github.com/YasushiKobayashi/samples/blob/master/src/next-sample/src/templates/Top/Top.spec.tsx#L22

## コンポーネントベースで不要なものは都度除外

コンポーネント単位でテストをする場合どうしても、input タグだけのコンポーネントなのに label がないとエラーになってもどうしようもないということがあるので、このコンポーネントではこのルールを除外したいということがあった場合は、都度除外することでテストを通すことができます。

また、すべてのルールにちゃんとドキュメントがあり、今守りたいルールなのか考えながら導入していくことが可能です。

下記のように基本的に日本語に翻訳されているルールも多いです。

https://dequeuniversity.com/rules/axe/4.4/label?lang=ja

## hygenでアクセシビリティテストをコンポーネント作成フローに組込む

下記の記事でも書いたように、最近はコンポーネントを作成する時は hygen を使用してテンプレートを元にテストファイルまで作成しているので、テンプレートで必ず axe のテストをするように仕組みづくりができています。

https://zenn.dev/ptpadan/articles/hygen-storybook-jest

## Playwright axeでE2Eテストでもアクセシビリティテストする

`@axe-core/playwright` を使うことで、E2E テストの中でもアクセシビリティテストができます。

全てに対応しようとすると難しいものも多いので対応できてないルールも多いのですが、1 つのコンポーネントをテストするだけでは検出できるできないエラーを発見でき、例えばこのように h1 タグに関するエラーを出してくれます。

```typescript
{
    id: 'page-has-heading-one',
    impact: 'moderate',
    tags: [ 'cat.semantics', 'best-practice' ],
    description: 'Ensure that the page, or at least one of its frames contains a level-one heading',
    help: 'Page should contain a level-one heading',
    helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/page-has-heading-one?application=playwright',
    nodes: [ [Object] ]
},
```

### Playwright axeのセットアップ

Playwright axe でも同様に axe を実行するためのラッパーを用意し、都度ページの状態が変わるたびにテストを実行するようにしています。

完全な運用は難しそうなので、エラーが見つかった際にテストを落とす運用はまだしていないです。

```typescript
 import AxeBuilder from '@axe-core/playwright'

export const axeRunner = async (page: Page, disableRules: string[] = []) => {
  const results = await new AxeBuilder({ page })
    .disableRules(['image-alt', 'color-contrast', 'meta-viewport', 'link-name', ...disableRules])
    .analyze()

  if (results.violations.length > 0) {
    const title = await page.title()
    const url = page.url()
    console.error(title, url, results.violations)
    // test.fail()
  }
}
```

Playwright のセットアップやテストの書き方については、こちらを参考にしてください Playwright が実行できていればすぐに上記のような方法でテスト可能です。。

https://zenn.dev/ptpadan/articles/playwright-e2e

今回サンプルコードにした内容や、動作確認で使用したコードは全てこちらの PR で作成しており、すべて動作確認可能です。
