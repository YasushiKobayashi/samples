---
title: ecs/ec2インスタンス一台で動く、Laravelのapi環境をTerraformで構築する
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Terraform', 'Lalavel', 'ecs', 'ec2']
published: false
---

Laravel/ec2/docker-compose の手動デプロイで動いている API サーバーを自動デプロイがしやすく、今後の運用がしやすくなるように ecs/ec2 の構成に移行しました。

また、全てのリソースは手動で管理されていたので、Terraform で管理するようにしました。

### 将来的にも運用が楽なのでコンテナベースの運用に

既存でも STG 環境だけ、自動でデプロイができるようにしていました。

既存の構成では CI 体制はなかったのですが、SSM でログインできるようになっていたため、CI から run command で Git pull/Laravel のキャッシュ等を更新をするようにして、とりあえずの自動デプロイができるようにしていました。

自動デプロイをするだけであれば、同様の構成にすることでも実現可能ではありましたが、既存のインフラには下記のような課題がありました。

- 手動運用がどうしても発生してしまう
    - 当時の構成は、`.env`などはインスタンスにあるものを直接編集するフローがあり、コード管理ができない状態です
    - 手動デプロイをしてるために、サーバーが落ちていることもありました(health check/UptimeRobot が落ちている状態)
- 環境が immutable ではない
    - `.env` など手動で更新していることもありましたし、vendor の状態がわからず、想定外で自動デプロイがコケていることがありました 
- image の作りがあまりよくなく、ログのパーミッションエラーが発生していることがある
- ec2 上の docker の volume にしか、ログの永続化がされていない
    - 小規模サービスのため一旦問題ないのですが、将来的には好ましくない状態でした
- autoscale 構成になっていない
    - ロードバランサー配下にはありましたが、autoscale 構成になっていないため、サーバーが落ちた場合自動では復旧できない可能性があります
    - こちらも同様に、小規模サービスのためリスクとしてはあまりないです

現状明確なリスクがあるのは、手動構成・immutable ではないことです。

その他の構成については、一緒に解決ができれば better ですが、一旦は問題がない状態です。

## ecs/ec2の構成にした理由

上記の課題に対して、この構成にした理由としては主にこれらの理由があります。

- ecs/ec2 が安いため
- 将来的にも運用が楽なので、コンテナだけを管理するようにしたかった

### ecs/ec2が安いから

ecs/ec2 構成にした理由として、まだそのサービスはリリースしたばかりのものであり、サーバーも 1 台で住んでいる小規模サービスのため、コンテナベースの運用をする場合、必然的に ecs になりました。

k8s の経験がありましたが ecs は未経験だったため、もともとは eks にしたかったのですが、ecs だと無料で運用ができるためです。

fargate も同様の理由で、現状のインスタンスサイズ・台数を考慮すると fargate は割高なため、ec2 で運用をしています。

## 各種リソースの作成をしていく

Terraform で、ecs に必要なリソースを作成していきます。
下記のものも Terraform で作成していますが、特に今回の構成で違いは少ないので、詳細を見たい方は GitHub からソースを見てください。

- vpc
- ecr
- alb/security group 関連

## 作り直したもの、importしたもの

またこのインフラ管理は途中から自分が引き継いだものであるあるため、terraform で管理していくには import していくか、

vpc 関連は import が簡単ですし、新規作成する必要も特になかったので、import しました。

ロードバランサーは route53 と紐付けを変えれたほうが楽なので新規に作成し、セキュリティグループも import はできますが、一通りのリソースは新規作成しました。

## autoscale関連を作成していく

autoscale 関連のリソースを作成するにあたって、気をつける必要があるのは health check

```Terraform
```


## rdsの作成

rds の作成では、初期ユーザーのパスワードの設定などが必要になるため、パスワードの暗号化が必要です。

今回は暗号化のために aws の managed の kms を使用しました。秘密鍵の管理などは特に必要がなく、楽に管理できるので、aws に全てを委ねるようにしています。

ただし、この方法だと state には平文の password などが入ってしまいますし、state にも絶対に情報を残したくない場合は違う方法を取ったほうが良さそうです。

```hcl
resource "aws_kms_key" "api" {
  description             = "api task master key"
  deletion_window_in_days = 10
}

resource "aws_kms_alias" "api" {
  name          = "alias/laravel-ecs-ec2-1instance"
  target_key_id = aws_kms_key.api.key_id
}

data "aws_kms_secrets" "rds" {
  secret {
    name    = "root_username"
    payload = "xxx"
  }
  secret {
    name    = "root_password"
    payload = "xxx"
  }
}
```

payload を作成するためには、下記のシェルスクリプトを作成し、`./kms.sh root`、を実行して作成しました。

`echo -n` はおそらく`bash` にしかないので、`sh kms.sh root` のように実行すると-n ごと入ってしまうので、気をつけてください。

また、echo だけだと不要な改行コードが含まれてエラーになってしまいます。

```bash
#!/bin/bash
echo -n $1 > enc.txt
aws kms encrypt \
  --key-id alias/laravel-ecs-ec2-1instance \
  --plaintext fileb://enc.txt \
  --query CiphertextBlob \
  --output text | pbcopy
```

## ecs関連の作成

## 想定外でハマったこと

### ecsを動かすためにハマったこと

### Laravel/nginxでハマったこと

- image の作り方の問題ですが、キャッシュ周りでけっこうハマりました
- エラーメッセージがおかしいことがあった
  - db 接続用の OS の環境変数の設定を間違っていただけなのに、PDO とは全く別のエラーが発生したりしており、何が原因でエラーが発生しているか把握することに時間がかかってしまうことがありました
- cron で環境変数を読み込めない
  - 下記のように`entrypoint.sh` に環境変数の情報を書き出し、cron で実行する際にそれらを読み込むようにしました。

```bash
#!/bin/bash

set -e

/etc/init.d/cron start

declare -p | grep -Ev 'BASHOPTS|BASH_VERSINFO|EUID|PPID|SHELLOPTS|UID' > /container.env

# @TODO サーバー複数台にする際には分離する
php artisan config:cache
php artisan migrate --seed --force &
exec "php-fpm"
```
```bash
SHELL=/bin/bash
BASH_ENV=/container.env

* * * * * /usr/local/bin/php /var/www/artisan schedule:run
```

### ciにデプロイフローを組み込むにあたってハマったこと

使用したいイメージを更新したいだけだから楽だろうって最初は思っていたのですが、意外とツールの選定含めて時間がかかりました。

https://github.com/silinternational/ecs-deploy

```make
COMMIT_ID := $(shell git log -n 1 --pretty=format:"%H")

deploy-stg-api:
	make build-app
	./ecs-deploy -c stg-api --service-name stg-api --image ${aws_id}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}
```

### どこでエラーが発生して、タスクの更新ができていないのかわからなかった　


## その他

自分は aws のリソースは Terraform で厳密に管理をしたいので、Terraform を使用していますが、copilot などを使ったほうが基本的に楽なかもしれません。

どこまで、このようなツールが管理できるか把握しきれていないのですが、docker-compose と連携して簡単に task を作成したり、alb/autoscale 関連も面倒を見てくれたりするようなので、基本的に手っ取り早く ecs 環境を構築したい場合はこのようなツールを使ったほうが良さそうです。

https://github.com/aws/copilot-cli

