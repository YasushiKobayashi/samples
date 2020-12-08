variable "region" {
  default = "ap-northeast-1"
}

provider "aws" {
  region = var.region
}

terraform {
  required_version = ">= 0.14"

  backend "s3" {
    bucket = "sample-repository-tfstate"
    key    = "global.tfstate"
    region = "ap-northeast-1"
  }
}
