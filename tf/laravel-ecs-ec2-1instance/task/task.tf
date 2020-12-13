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
        # 暗号化するべきだが、面倒なので・・・
        { "name" : "APP_ENV", "value" : "base64:YH7F1huFkWpLU+jmoFbO8o+R30TCtJPT8wNNc/8SdC8=" },
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

