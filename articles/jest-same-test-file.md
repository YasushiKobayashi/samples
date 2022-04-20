---
title: jestでテストファイルと実装ファイルをまとめてみる
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['jest', 'JavaScript', 'TypeScript']
published: true
---

## テストファイルと実装ファイルを同一にすることで、exportする必要がないコードもテストできるようにしたい

例えば、rust だと以下のように、実装に関するファイルとテストコードを同一のファイルに書くことができます。

```rust
fn return_false() -> bool {
    return false;
}

#[test]
fn assert_false() {
    let res = return_false();
    assert_eq!(return_false, false);
}
```

https://play.rust-lang.org/?version=stable&mode=debug&edition=2018&gist=37728aa589bd26d26f0206dac9e9e98b

実装とテストが同じ場所にあることで、以下の様なメリットがあります。

- 同一ファイルにテストを書くことで、不要な export をさけることができる
- テスト用に新たなファイルを作成することなく、すぐにテストを書き始めることができる
- 実装とユニットテストの距離が近いため、コードの理解がしやすい

のようなメリットがあり、この書き方を他の言語でもしてみたいなと思ったので、jest でできるかを試してみます。

結論としては、`jest.config` を頑張り、テストコードの書き方を工夫することできました。

## `src/*` を対象にテストを回すようにする

まず、`testRegex` を以下のようにします。絶対パス必要なので、`path`などを使って書く必要があります。

`jest.testRegex = path.resolve(__dirname, 'src')`  

こちらで、src 以下に基本的な実装コードが入っている場合は、src 以下だけを対象にテストを回すことができるようになります。
`__tests_` にテストがある場合は、対象に入りませんが src 以下すべてを対象にしているため`src/main.spec.ts`などはもちろんこの方法でも対象に入ります。

ただしこの方法の場合は、テストがないファイルもテストの対象実行に含まれてしまうので、テストが不要なファイルは実行結果から除外するようにしたいです。

## テストがないファイルは除外するようにする
テストがないファイルは除外するようにしたいですが、正規表現でそのまま頑張るのは、実装ディレクトリを工夫したりしないといけないため少し面倒です。
`jest.testRegex`は array も使えるため少し雑ですが、`describe`が入っているファイルの一覧を検索することでテストファイルとみなし、シェル芸で対象ファイルを絞り問題なくテストを実行できました。

このやり方は、`// @TEST` でコメントを書いて検索するなど何でもいいです。

この方法でテストが必要なファイルのリストアップができたの、 `src/*`以下を対象にテストを回す必要はなくなったので、 `testRegex` の記述は消しても大丈夫です。


※エラーが出ないよりベターな書き方をコメントいただいたので、下記コードの修正をしています。

```javascript
const basePath = path.resolve(__dirname, 'src')
const spawn = spawnSync(`grep -ril describe ${basePath}/*`, { shell: true })
const targets = []

if (spawn.status === 0) {
  spawn.stdout
    .toString()
    .split('\n')
    .forEach(filePath => {
      if (filePath) targets.push(filePath)
    })
} else if (spawn.status !== 1) {
  throw new Error(spawn.error.message)
}

jest.testRegex = targets.concat([jest.testRegex])
```

## bundle後のファイルに差分はあるか

この書き方でテストを書けることはわかりましたが、`import`の仕方によっては、proudction コードにも影響がでてしまいそうなので、影響がないか rollup が生成するコードで確認をしてみます。
rollup でビルドしてみたコードを確認すると、下記のコードが生成されています。
jest の`describe` が残ってしまっているため、消さないと他で import した際にエラーとなります。



```javascript
var test = function () {
    return true;
};
var main = function () {
    return test();
};
describe('main', function () {
    it('test', function () {
        var res = test();
        expect(res).toBeTruthy();
    });
});

export { main };
```

rollup では `rollup-plugin-terser` を使うことで、圧縮する際に簡単にテストコードの削除できます。
下記のコメントを追加することで、テストコードが圧縮する際に自動で削除されます。


```typescript
/* @__PURE__ */
describe('main', () => {
  it('test', () => {
    const res = test()
    expect(res).toBeTruthy()
  })
})
```

### テスト用のimportも可能

上記でテストコードがあっても問題ないようにできましたが、テストコード用の import 文があった場合に、コードに問題がないか試してみます。

少し面倒な書き方をしていますが、こちらの書き方で `@testing-library/react` を使っても、問題なくテストを実行できました。

型情報は補完のためにもほしいので import していますが type only で import しなければ、 rollup でのビルドは失敗しました。

```typescript
import * as React from 'react'
import type { render } from '@testing-library/react'

export const Component: React.FC = () => {
  return <div>test</div>
}

type TestUtils = {
  render: typeof render
}

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const testUtils: TestUtils = {}

/* @__PURE__ */
describe('Component', () => {
  beforeAll(async () => {
    const { render } = await import('@testing-library/react')
    testUtils.render = render
  })

  afterEach(async () => {
    const { cleanup } = await import('@testing-library/react')
    cleanup()
  })

  it('render test', async () => {
    const { container, asFragment } = testUtils.render(<Component />)
    expect(container.textContent).toContain('test')
    expect(asFragment()).toMatchSnapshot()
  })
})
```

こちらのように、バンドル後の js にも影響はないです。

```javascript
import {createElement as t} from "react";
var r = function () {
        return "test method"
    },
    e = function () {
        return t("div", null, "test")
    };
export {
    e as Component,
    r as main
};
// # sourceMappingURL=jest-same-example-rollup.esm.js.map
```

### createMockは使用できない
ただし、 `ts-auto-mock` のようなテスト時のビルド方法に依存したライブラリを使用すると、rollup でのビルドは失敗しました。

## Next.jsでテストを同一ファイルに書く

Next.js を使用する場合は rollup の時と同様に書くことはできず、 `process.env.NODE_ENV === 'test'` で囲う必要がありました。

それ以外は、同様に書くことができビルド後のコードにも、影響はなさそうでした。

```typescript
if (process.env.NODE_ENV === 'test') {
  /* @__PURE__ */
  describe('Component', () => {
    beforeAll(async () => {
      const { render } = await import('@testing-library/react')
      testUtils.render = render
    })

    afterEach(async () => {
      const { cleanup } = await import('@testing-library/react')
      cleanup()
    })

    it('render test', async () => {
      const { container, asFragment } = testUtils.render(<Pages />)
      expect(container.textContent).toContain('test')
      expect(asFragment()).toMatchSnapshot()
    })
  })
}
```

\* 2022/4/20 追記

\* jest か testing-library のアップデートかどれが原因なのか、調査まではできていないので、下記のエラーが出て非同期で import するのはできなくなっていました。

```
Cannot add a hook after tests have started running. Hooks must be defined synchronously.
```


該当の PR は下記です。
https://github.com/YasushiKobayashi/samples/pull/531/files


rust のように、言語仕様でできる言語同様にテストを書くことができるわけではないですが、 js(ts) でも同様のテストの実行は可能でした。

今回サンプルコードにした内容は全てこちらの PR で作成しており、すべて動作確認可能です。

https://github.com/YasushiKobayashi/samples/pull/59
https://github.com/YasushiKobayashi/samples/tree/master/src/jest-same-example-rollup
https://github.com/YasushiKobayashi/samples/tree/master/src/jest-same-example-next

2021/8/21 追記：jest/ts-jest を 27 系に update すると、非同期での react-test-utils の import が動かなかったです。通常の import の場合動作します。
