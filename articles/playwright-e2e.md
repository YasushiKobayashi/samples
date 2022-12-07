---
title: E2Eテストフレームワークをこれから選ぶならPlaywright一択
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Playwright', 'E2E', 'frontend']
published: true
---

## Playwrightとは

Playwright は Microsoft が開発している E2E テスト用のフレームワークです。

Selenium・Cypress・TestCafe など、いくつかの E2E テストのフレームワークを使ったことがありますが、一番使いやすいフレームワークだと感じており、今後は E2E テストを導入する際は Playwright 一択だと考えています。


## Playwrightのメリット

### ユーザーの動きに近い形でテストケースを自動生成できる

`npx playwright codegen http://localhost:3000` のような形式でコードの自動生成ができるのですが、これまで触ってきたどのツールよりも圧倒的にいいコードが生成されます。

class 名などではなく Testing Library のように label などをベースにしており、アクセシビリティを意識した HTML を書くことができていれば、ある程度自動生成したコードをそのまま使えます。

```typescript
import { test, expect } from '@playwright/test';
test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await page.getByLabel('First Name').click();
  await page.getByLabel('First Name').fill('first name');
  await page.getByLabel('First Name').press('Tab');
  await page.getByLabel('Last Name').fill('last name');
  await page.getByRole('button', { name: 'submit' }).click();
});
```

### ログがこれまでのどのツールよりも分かりやすい

Playwright でテストを失敗したときは、デフォルトでテストの記録である動画と、テスト時の DOM の状態やスクリーンショット・console・ネットワーク等のログを細かく残してくてれる zip 形式のログがあります。

![](/images/playwright/trace.png)


このログによりテストの失敗原因がわからなくなることがほとんどなくなり、デバッグしやすいです。


### ブラウザの自動操作が速い

こちらはベンチマークを取ったわけではないですが、今まで使ったことがある他のライブラリーと比べて圧倒的に実行時間が短いと感じています。

> Playwright enables reliable end-to-end testing for modern web apps.`

と公式にもあり、速さと信頼性を押し出しているので、他のツールよりも速いはずです。

https://playwright.dev/docs/why-playwright#fast-and-reliable-execution

## 他のツールとの比較

### Selenium/Cypress/TestCafe

- コードの自動生成の使いやすさ
- ユーザーの行動にに即したコードが書きやすい
- ログの読みやすさ
- 実行時間の速さ

上記をもとに、自分はこれら３つで E2E テストを書いたことがあり、どれも Playwright の方が便利だと感じています。

### Autify

Autify はフレームワークではありませんが、E2E テスト作成用のサービスとして使用したことがあるので、こちらも比較してみます。

GUI で完結するテストの作る簡単さは Autify の方が圧倒的に上で、自動で UI の変更への追従もある程度あるのでテストのメンテナンスのしやすいです。

ログのみやすさは、どちらも別の良さがあります。実行時の DOM や console の状態などの細かい情報は Playwgiht の方が多くありますが、Autify でも動画で画面の状態を詳しく見ることは可能です。
Autify にしかないのは、前回のテスト結果との画面のスクリーンショットの差分があることでなぜ今落ちたのかわかりやすいです、ただ自分は Autify のスクショを regsuite でビジュアルリグレッションテストをしているので近いことをそれでもできています。

実行時間は、CI で継続的に Autify を回したことがないのでそこまで意識したことがないすが、Playwight の方がおそらく圧倒的に速いです。

そのため予算が許せて、誰でも簡単に E2E テストを作れる環境を作りたいのであれば、Autify の方が良さそうですが、CI と連携した素早くテストを実行したい場合は Playwright の方がいいかもしれません。


今回サンプルコードにした内容や、動作確認で使用したコードは全てこちらの PR で作成しており、すべて動作確認可能です。

https://github.com/YasushiKobayashi/samples/pull/760

https://github.com/YasushiKobayashi/samples/tree/master/src/playwright-sample

https://github.com/YasushiKobayashi/samples/tree/master/src/next-sample
