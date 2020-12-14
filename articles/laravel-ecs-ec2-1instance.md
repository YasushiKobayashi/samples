---
title: ecs/ec2インスタンス一台で動く、Laravelのapi環境をTerraformで構築する
emoji: "📚"
type: "tech" # tech: 技術記事 / idea: アイデア
topics: ['Terraform', 'Laravel', 'ecs', 'ec2']
published: true
---

Laravel/ec2/docker-compose の手動デプロイで動いている API サーバーを自動デプロイがしやすく、今後の運用がしやすくなるように ecs/ec2 の構成に移行しました。

また、全てのリソースは手動で管理されていたので、terraform で管理するようにしました。

## 現状のインフラの課題

既存でも STG 環境だけ、自動でデプロイができるようにしていました。

既存の構成では CI 体制はなかったのですが、SSM でログインできるようになっていたため、CI から run command で Git pull/Laravel のキャッシュ等を更新をするようにして、とりあえずの自動デプロイができるようにしていました。

自動デプロイをするだけであれば、同様の構成にすることでも実現可能ではありましたが、既存のインフラには下記のような課題がありました。

- image の作りがあまりよくなく、ログのパーミッションエラーがまれに発生していた
- 手動運用が発生してしまう
    - 当時の構成は、`.env`などはインスタンスにあるものを直接編集するフローがあり、コード管理ができていないです
    - 手動デプロイをしてることによる操作ミスで、サーバーが落ちることもありました
- 環境が immutable ではない
    - サーバー内のコンテナの vendor の状態がわからず、想定外に自動デプロイがコケていることがありました 
- ec2 上の docker の volume にしか、ログの永続化がされていない
    - 小規模サービスのため一旦問題ないのですが、将来的には好ましくない
- autoscale 構成になっていない
    - ロードバランサー配下にはありましたが、autoscale 構成になっていないため、サーバーが落ちた場合自動では復旧できない可能性があります
    - こちらも同様に、小規模サービスのためリスクとしてはあまりないです

現状明確なリスクがあるのは、ログのパーミッション・手動構成・immutable ではないことです。

その他の構成については、一緒に解決ができれば better ですが、一旦は問題がない状態です。

## ecs/ec2の構成にした理由

上記の課題に対して、この構成にした理由としては主にこれらの理由があります。

- ecs/ec2 が安いため
- 将来的にも運用が楽なので、コンテナだけを管理するようにしたかった

ecs/ec2 構成にした理由として、まだそのサービスはリリースしたばかりのものであり、サーバーが 1 台で住んでいる小規模サービスのため、コンテナベースの運用をする場合、必然的に ecs になりました。

k8s は経験があり ecs は未経験だったため、もともとは eks にしたかったのですが、無料で運用ができる ecs にしました。

fargate も同様の理由で、現状のインスタンスサイズ・台数を考慮すると割高なため、ec2 上で運用をしています。

また、autoscale/codedeploy や ansistrano などで既存に近い形でも運用できますが、極力コンテナだけを管理したかったため ecs にしました。

## terraformで作成したもの

下記のものも terraform で作成していますが、特に今回の構成で違いは少ないので、詳細を見たい方は GitHub からソースを見てください（必要なものは全て terraform で作成しています）。

https://github.com/YasushiKobayashi/samples/tree/master/tf/laravel-ecs-ec2-1instance

- vpc
- ecr
- ecs
  - task/role/kms/ssm parameter 等
- alb/security group 関連
  - セッションマネージャーでログインできる role
- ci 用の ecr/ecs デプロイ用のユーザー

## 作り直したもの、importしたもの

またこのインフラ管理は途中から自分が引き継いだものであるため、terraform で管理していくには import していくか新規作成していく必要があります。

vpc 関連は import が簡単ですし、新規作成する必要も特になかったので、import しました。

ロードバランサーは route53 と紐付けを変えたほうが楽なので新規に作成し、セキュリティグループも import はできますが、一通りのリソースは新規作成しました。

## ロードバランサー関連を作成していく

今回の ecs/ec2 の構成でロードバランサー 関連のリソースを作成するにあたって、気をつける必要がある 1 つは health check です。

protocol 等はいつもどおり作成すればいいですが、health check でポート番号を指定してはいけません。

php-fpm/nginx で nginx が 80 番ポート開くことが多いですが、1 つのインスタンスで nginx のポートが 80 番で固定だとデプロイ時に古いコンテナを止める必要があります。

ecs の動的ポートマッピングを使用すると、ngnix コンテナのポートを動的にし health check 関連もよしなにやってくれるため、ポート番号を health check で指定してはいけません。

```hcl
resource "aws_alb_target_group" "api" {
  name                 = var.app_name
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.api.id
  deregistration_delay = 30

  health_check {
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 4
    matcher             = 200
  }
}
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

payload を作成するためには、下記のシェルスクリプトを作成し、`bash kms.sh root`、を実行して作成しました。

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

ecs 関連のリソースは下記のように作成しています。

capacity provider や deployment 関連の設定は今のところあまり覚えなくても良さそうだったので、設定の正しい値の計算方法はあまりわかってないのですが、一旦こちらの設定値で動いています。

```hcl
resource "aws_ecs_capacity_provider" "api" {
  name = var.app_name

  auto_scaling_group_provider {
    auto_scaling_group_arn         = data.terraform_remote_state.api.outputs.autoscaling_group_api.arn
    managed_termination_protection = "DISABLED"

    managed_scaling {
      maximum_scaling_step_size = 100
      minimum_scaling_step_size = 1
      target_capacity           = 100
      status                    = "ENABLED"
    }
  }
}

resource "aws_ecs_cluster" "api" {
  name               = var.app_name
  capacity_providers = [aws_ecs_capacity_provider.api.name]

  default_capacity_provider_strategy {
    base              = 0
    weight            = 1
    capacity_provider = aws_ecs_capacity_provider.api.name
  }
}

resource "aws_ecs_service" "api" {
  name            = var.app_name
  task_definition = aws_ecs_task_definition.api.arn
  cluster         = aws_ecs_cluster.api.arn
  launch_type     = "EC2"
  desired_count   = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  load_balancer {
    target_group_arn = data.terraform_remote_state.api.outputs.alb_target_group_api.arn
    container_name   = var.nginx_container_name
    container_port   = 80
  }
}
```

タスクの作成はこちらで、ssm parameter/cloud watch logs などを使っています。また、それらを使用するための権限を持った role を作成してタスクを実行するようにしています。

また、health check で説明した ecs の動的ポートマッピングを使用するために、nginx の hostPort は 0 を指定します。

デプロイについての詳細は後述しますが、ecr に push する際の image id は Git のコミットハッシュを使用しており、使用するべき image id が terraform 上ではわからないので local 変数を適宜更新する形に一旦しています。

ここでは例えば、docker image を push するときは latest も push してそれを terraform では参照するなどの対応ができそうですが、最適な管理方法はまだわかっていません。

```hcl
locals {
  # apiリポジトリのコミットIDに合わせ、デグレしないように気をつける
  nginx_image_id   = "822907c4c251f0f1840f330b4ef58d4c3dee8917"
  api_image_id = "4e0f97c08499a2fb178f4f040602f5661b753e28"
}

resource "aws_ecs_task_definition" "api" {
  family                   = var.app_name
  requires_compatibilities = ["EC2"]
  execution_role_arn       = aws_iam_role.api.arn
  container_definitions = jsonencode([
    {
      "name" : var.nginx_container_name,
      "image" : "${data.terraform_remote_state.api.outputs.ecr_repository_nginx.repository_url}:${local.nginx_image_id}",
      "memory" : 256,
      "essential" : true,
      "links" : [
        "app",
      ],
      "portMappings" : [
        {
          "containerPort" : 80,
          "hostPort" : 0,
        },
      ],
      "logConfiguration" : {
        "logDriver" : "awslogs",
        "options" : {
          "awslogs-create-group" : "true",
          "awslogs-group" : "nginx-api",
          "awslogs-region" : "ap-northeast-1",
          "awslogs-stream-prefix" : "prod",
        }
      },
    },
    {
      "name" : "app",
      "image" : "${data.terraform_remote_state.api.outputs.ecr_repository_api.repository_url}:${local.api_image_id}",
      "secrets" : [
        { "name" : "DB_USERNAME", "valueFrom" : aws_ssm_parameter.db_username.arn },
        { "name" : "DB_PASSWORD", "valueFrom" : aws_ssm_parameter.db_password.arn },
      ],
      "environment" : [
        { "name" : "APP_ENV", "value" : "production" },
        { "name" : "DB_HOST", "value" : data.terraform_remote_state.api.outputs.db_instance_api.address },
      ],
      "memory" : 512,
      "essential" : true,
      "pseudoTerminal": true,
      "logConfiguration" : {
        "logDriver" : "awslogs",
        "options" : {
          "awslogs-create-group" : "true",
          "awslogs-group" : "api",
          "awslogs-region" : "ap-northeast-1",
          "awslogs-stream-prefix" : "prod",
        },
      },
    },
  ])
}

```


また、task/ecs 関連はディレクトリを分けて apply するようにしています。

https://github.com/YasushiKobayashi/samples/tree/master/tf/laravel-ecs-ec2-1instance/task


## デプロイ方法

デプロイは ecs-deploy という shell script を使用しました。

https://github.com/silinternational/ecs-deploy

ecs のデプロイには様々なツールがありますが、使用するイメージを更新したいだけの最低限のデプロイには ecs deploy が適しているように思います。

`./ecs-deploy -c api --service-name api --image ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}` のように使用するイメージを上書きするだけでデプロイができます。

構築したサービスでは、この Makefile を GitHub actions で実行しています。

```
COMMIT_ID := $(shell git log -n 1 --pretty=format:"%H")
ACCOUNT_ID := $(shell aws sts get-caller-identity | jq -r ".Account")

build-app:
	aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com
	docker build --target builder -t api -f ./docker/app/Dockerfile .
	docker tag api:latest ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}
	docker push ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}

deploy-api-app:
	make build-app
	./ecs-deploy -c api --service-name api --image ${ACCOUNT_ID}.dkr.ecr.ap-northeast-1.amazonaws.com/api:${COMMIT_ID}
```

ci 用のユーザーに付与した権限はこちらを参考にしてください。

権限を絞り切れていないのですが、動作はしています。

```hcl
resource "aws_iam_user" "api_ci" {
  name = "api-ci-deploy"
}

resource "aws_iam_user_policy_attachment" "api_ci" {
  policy_arn = aws_iam_policy.api_ci.arn
  user       = aws_iam_user.api_ci.name
}


resource "aws_iam_policy" "api_ci" {
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        // ecrのトークン取得
        "Sid" : "GetAuthorizationToken",
        "Effect" : "Allow",
        "Action" : [
          "ecr:GetAuthorizationToken"
        ],
        "Resource" : "*"
      },
      {
        // ecrのpush
        "Effect" : "Allow",
        "Action" : [
          "ecr:GetDownloadUrlForLayer",
          "ecr:BatchGetImage",
          "ecr:BatchCheckLayerAvailability",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
        ],
        "Resource" : [
          aws_ecr_repository.nginx.arn,
          aws_ecr_repository.api.arn,
        ]
      },
      {
        "Effect" : "Allow",
        "Action" : [
          "ecs:DeregisterTaskDefinition",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:ListTaskDefinitions",
          "ecs:RegisterTaskDefinition",
          "ecs:StartTask",
          "ecs:StopTask",
          "ecs:UpdateService",
          "iam:PassRole",
        ],
        "Resource" : [
          "*",
        ],
      },
    ],
  })
}
```


## 想定外でハマったこと

### ecsを動かすためにハマったこと

ecs 関連ではどこでエラーが発生して、タスクの更新ができていないのかわからずに最初はハマりました。

タスクの開始までできていれば、基本的にコンテナ関連の問題なので task の起動が失敗しているケースなど、最初は管理画面のどこを見ればいいかわからずハマりました。

サービス以下にイベントというタブがあり、こちらでタスクの起動関連の状況・エラーなどが見れます。現状はインスタンス全て止めてるので実行数インスタンスがなくてエラーが発生しています。

![](https://storage.googleapis.com/zenn-user-upload/byuhj4jrmwdgevo7e476gbm9c9yf)


### Laravel/nginxでハマったこと

#### たまにエラーメッセージの内容がおかしい
db 接続用の OS の環境変数の設定を間違っていただけなのに、PDO とは全く別のエラーが発生したりしており、何が原因でエラーが発生しているか把握することに時間がかかってしまうことがありました。

設定不備/キャッシュがおかしいときはエラーメッセージが信用できないこともあるので、状況からエラー内容を想定したほうがエラーに結びつく可能性があります。

エラー内容がはっきりとわからずに解決する必要があったので、ここが一番ハマりました。

### cron で環境変数を読み込めない

下記のように`entrypoint.sh` に環境変数の情報を書き出し、cron で実行する際にそれらを読み込むようにしました。

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

## その他

自分は aws のリソースは terraform で厳密に管理をしたいので、terraform を使用していますが、copilot などを使ったほうが基本的に楽かもしれません。

どこまで、このようなツールが管理できるか把握しきれていないのですが、docker-compose と連携して簡単に task を作成したり、alb/autoscale 関連も面倒を見てくれたりするようなので、基本的に手っ取り早く ecs 環境を構築したい場合はこのようなツールを使ったほうが良さそうです。

https://github.com/aws/copilot-cli

