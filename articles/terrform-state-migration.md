---
title: Terraformで誤って、stateをmigrationしてしまったときの対策
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Terraform']
published: true
---

Terraform で aws のリソースを管理し state は S3 で管理しているのですが、人的ミスにより削除してはいけないリソースを削除してしまったので、その発生経緯と対策をまとめます。

## Terraformのstateが他のものが引き継がれてしまっている

state や provider の設定などは、基本的にどのディレクトリでも一緒になるので大体はファイルごとコピーを行い、state のキーだけを変更して`terraform init`を行っていました。

今回は、state のキーの変更を忘れて、 `terraform init` を先に行ってしまいました。

plan の段階で予期せず削除されてしまうリソースがあり、気付けるパターンもあったのですが、気づかずに apply してしまうことがありました。

## stateのmigrationが発生するパターン、発生しないようにするためのパターン

### 特に何もしないで再度initをするとmigrationの確認が入る

s3 のキーだけを変更した状態で、`terraform init`を行うと新規 state への migration をするか確認が入ります。

init だから大丈夫だろうと yes にすると migration されて、誤ってリソースを削除してしまう可能性がでてきます。

ここで migration をすると workspace が複数ある場合は、全ての workspace の state が migration されます。

```bash
~/g/s/g/r/s/s/t/test ❯❯❯ terraform init                                                                                                                          ✘ 1  Vmaster ✭ ◼

Initializing the backend...
Backend configuration changed!

Terraform has detected that the configuration specified for the backend
has changed. Terraform will now check for existing state in the backends.


Do you want to migrate all workspaces to "s3"?
  Both the existing "s3" backend and the newly configured "s3" backend
  support workspaces. When migrating between backends, Terraform will copy
  all workspaces (with the same names). THIS WILL OVERWRITE any conflicting
  states in the destination.

  Terraform initialization doesn't currently migrate only select workspaces.
  If you want to migrate a select number of workspaces, you must manually
  pull and push those states.

  If you answer "yes", Terraform will migrate all states. If you answer
  "no", Terraform will abort.

  Enter a value:
```

今回のようなケースで誤って migration を行った場合は、s3 のファイルごと削除してしまうか、state を全部削除してしまうのがいいでしょう。

また no を選択した場合でも、workspace の情報は引き継がれます。

### .terraform以下を削除してからinitする

完全新規のいつもどおりの状態になるので、今回のようなケースで init する場合は、この方法を取ったほうが良さそうです。


## 対策方法

上記の migration の発生条件を把握しておくことで今回のケースの発生は防ぐことができそうです。

また、migration してしまった場合は、気づいた段階で不要な state を削除していくことで適切な状態に戻せます。
