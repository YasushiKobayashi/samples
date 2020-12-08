provider "aws" {
  region = var.region
}

terraform {
  required_version = ">= 0.14"

  backend "s3" {
    bucket = "sample-repository-tfstate"
    key    = "laravel-ecs-ecs-1instance.tfstate"
    region = "ap-northeast-1"
  }
}

