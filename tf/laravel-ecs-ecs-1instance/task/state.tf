provider "aws" {
  region = var.region
}

terraform {
  required_version = ">= 0.12"

  backend "s3" {
    bucket = "sample-repository-tfstate"
    key    = "laravel-ecs-ecs-1instance-task.tfstate"
    region = "ap-northeast-1"
  }
}


data "terraform_remote_state" "api" {
  backend = "s3"

  config = {
    bucket = "sample-repository-tfstate"
    key    = "laravel-ecs-ecs-1instance.tfstate"
    region = "ap-northeast-1"
  }
}

