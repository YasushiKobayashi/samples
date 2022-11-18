---
title: Playwright
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Playwright', 'E2E', 'frontend']
published: true
---

## Playwrightとは

Playwright は Microsoft が開発している E2E テスト用のフレームワークです。

Selenium・Cypress・TestCafe など、いくつかの E2E テストのフレームワークを使ったことがありますが、一番使いやすいフレームワークだと感じており、今後は E2E テストを導入する際は Playwright 一択だと考えています。


## Playwrightのメリット

### コードの自動生成が賢い

`npx playwright codegen http://localhost:3000` のような形式でコードの自動生成ができるのですが、これまで触ってきたどのツールよりも圧倒的にいいコードが生成されます。

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

### ユーザーの思考に近い形でテストケースを作成することができる

### ログがこれまでのどのツールよりも分かりやすい

Playwright でテストを失敗したときは、デフォルトでテストの記録である動画と、テスト時の DOM の状態やスクリーンショット等のログを細かく残してくてれる zip 形式のログがあります。

![](/images/playwright/trace.png)


このログがあることによって、テストの失敗時の原因がわからなかったり、テスト用に log を増やす必要性がかなり減るので、失敗時にデバッグがしやすいです。


### ブラウザの自動操作が速い

こちらはベンチマークを取ったわけではないですが、今まで使ったことがある他のライブラリーと比べて圧倒的に実行時間が短いと感じています。

`Playwright enables reliable end-to-end testing for modern web apps.` と公式にもあり、速さと信頼性を押し出しているので、他のツールよりも速いはずです。

https://playwright.dev/docs/why-playwright#fast-and-reliable-execution

## 他のツールとの比較

### Selenium/Cypress/TestCafe

- ログの読みやすさ
- コードの自動生成の使いやすさ
- ユーザーに即したコードが書きやすい
- 実行時間の速さ

上記をもとに、他の

### Autify

Autify はフレームワークではありませんが、E2E テスト作成用のサービスとして使用したことがあるので、こちらも比較します。

GUI で完結するテストの作りやすさは、Autify の方が圧倒的に上で、自動で UI の変更への追従もある程度あるのでテストのメンテナンスのしやすさは高いと思います。

ただし、自分でプログラム書いているからこその自由度は Playwright の方が高いです。

そのため導入費用をかけられるが、
