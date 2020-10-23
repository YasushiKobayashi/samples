---
title: jestでテストファイルと実装ファイルをまとめてみる
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['jest', 'JavaScript']
published: true
---

## テストファイルと実装ファイルを同一にすることで、exportする必要がないコードもテストできるようにしたい

TODO: mogemoge

例えば、rust だと以下のように、実装に関するファイルとテストコードを同一のファイルに書くことができます。

```rust
fn return_false() -> bool {
    return false;
}

#[test]
fn guess_secret_number_same() {
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

結論としては、`jest.config` を頑張ることでできました。

## `src/*` を対象にテストを回すようにする

まず、`testRegex` を以下のようにします。絶対パス必要なので、`path`などを使って書く必要があります。

`jest.testRegex = path.resolve(__dirname, 'src')`  

こちらで、src 以下に基本的な実装コードが入っている場合は、src 以下だけを対象にテストを回すことができるようになります。
`__tests_` にテストがある場合は、対象に入りませんが src 以下すべてを対象にしているため`src/main.spec.ts`などはもちろんこの方法でも対象に入ります。

ただし、この方法の場合は、テストがないファイルもテストの対象実行に含まれてしまうので　
テストが不要なファイルは実行結果からじ除外するようにしたいです。


## テストがないファイルは除外するようにする
テストがないファイルは除外するようにしたいですが、正規表現でそのまま頑張るのは、実装ディレクトリを工夫したりしないといけないため少し面倒です。
`jest.testRegex`は array も使えるため少し雑ですが、`describe`が入っているファイルの一覧を検索することでテストファイルとみなし、シェル芸で対象ファイルを絞り問題なくテストを実行できました。

このやり方は、`// @TEST` 何でもいいです。

```javascript
const basePath = path.resolve(__dirname, 'src')
const stdout = execSync(`grep -ril describe ${basePath}/*`)
const targets = stdout
  .toString()
  .split('\n')
  .filter(v => v !== '')
jest.testRegex = targets
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

## テストのための import もプロダクションコードに影響を与えない

上記でテストコードがあっても問題ないようにできましたが、テストコード用の import 文があった場合に、コードに問題がないか試してみます。

```typescript
import testUtils from './testUtils'

const test = () => {
  return 'test method'
}

export const main = () => {
  return test()
}

/* @__PURE__ */
describe('main', () => {
  it('test', () => {
    testUtils()
    const res = test()
    expect(res).toBeTruthy()
  })
})
```

上記のコードでは、下記のよなコードが生成され、 `testUtils` に関するコードは残っていませんでした。
もちろん、 `export` しているメソッドで呼び出したりすると、import されます。

```javascript
var t = function () {
  return "test method"
};
export {
  t as main
};
//# sourceMappingURL=jest-same-example-rollup.esm.js.map
```


### createMockは使用できない
ただし、 `ts-auto-mock` のようなテスト時のビルド方法に依存したライブラリを使用すると、rollup でのビルドは失敗しました。

## Next.jsでテストを同一ファイルに書く
