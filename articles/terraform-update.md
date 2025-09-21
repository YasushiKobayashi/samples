---
title: 0.11系のTerraformを1系までupdateするためにやったこと
emoji: '📚'
type: 'tech' # tech: 技術記事 / idea: アイデア
topics: ['Terraform']
published: true
---

Terraform を 0.11 系で動いていたものを、一気に Terraform1 系まで一気に update しました。

まだ 0.11 系を使っている人はあまりいないと考えられるので、この記事のニーズがあるかわかりませんが、ハマりどころをまとめていきます。

## 古いバージョンが動かないので、上げないと身動きがとれなくなった

まず、このタイミングでバージョンアップをようやく行うことにした理由は下記で、運用が 0.11 系ではすでにできなくなっていたので、アップデートを行いました。

- 0.11 系で`terrafrom init` がなぜかできない、apply が絶対できない
- 0.11 系だと lambda で node14 が使えないので最新のバージョンを使えない
- 1 系がでたので、そろそろ上げたかった

## アップデートするためにやったこと

### 0.13系でapplyをして、stateを更新する

> This guide focuses on changes from v0.13 to v0.14. Terraform supports upgrade tools and features only for one major release upgrade at a time, so if you are currently using a version of Terraform prior to v0.13 please upgrade through the latest minor releases of all of the intermediate versions first, reviewing the previous upgrade guides for any considerations that may be relevant to you.

https://developer.hashicorp.com/terraform/language/upgrade-guides/0-14

上記のように、0.14 系より新しいバージョンの Terraform を使用するためには、0.13 系を経由して apply をして state の状態をバージョンアップできるようにする必要があります。

そのため、一気に 1 系に上げることはできず、小刻みにバージョンアップを進める必要があります。

また、output を使用している場合はまず 0.12 系で apply をして、state を更新する必要があります。

### workspace毎にapplyしてstateを更新する

workspace を使用している場合は、workspace 毎に state を管理しているのでもちろん、workspace 毎に apply して state を更新するがあります。

上記の手順を経て、0.13 系までアップデートができれば、基本的には 1 系まで簡単にアップデートができます。

## 各種マイナーバージョンは最新でapplyする

0.12 系だと 0.12.31 が最新だが、もともと入っていたのが 0.12.28 で下記のエラーが発生して、ローカルのバージョンと違うし、0.13.5 でも 1.0.5 でもまだ apply してないのにこのエラーが発生していてつまりました。

最新の 0.12.31 で apply することでアップデートを進めることができました。

同様の内容のエラーは 0.13 系で apply するときも発生しており、最新のマイナーバージョンでバージョンアップを進めたほうがスムーズに進められます。

```bash
Error: state snapshot was created by Terraform v1.0.5, which is newer than current v0.13.5; upgrade to
 Terraform v1.0.5 or greater to work with this state
```
