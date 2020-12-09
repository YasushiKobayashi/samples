locals {
  ecr_repository_policy = {
    Statement = [
      {
        "Sid" : "AllowPush",
        "Effect" : "Allow",
        "Principal" : {
          "AWS" : [
            aws_iam_user.api_ci.arn,
          ]
        },
        "Action" : [
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ]
      }
    ]
    Version = "2008-10-17"
  }

  ecr_lifecycle_policy = {
    rules = [
      {
        action = {
          type = "expire"
        }
        description  = "最新の5つを残してイメージを削除する"
        rulePriority = 1
        selection = {
          countNumber = 5
          countType   = "imageCountMoreThan"
          tagStatus   = "any"
        }
      },
    ]
  }
}

##############
# nginx
##############
resource "aws_ecr_repository" "nginx" {
  name                 = "nginx"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository_policy" "nginx" {
  repository = aws_ecr_repository.nginx.name
  policy     = jsonencode(local.ecr_repository_policy)
}

resource "aws_ecr_lifecycle_policy" "nginx" {
  repository = aws_ecr_repository.nginx.name
  policy     = jsonencode(local.ecr_lifecycle_policy)
}

##############
# api
##############
resource "aws_ecr_repository" "api" {
  name                 = "api"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_repository_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy     = jsonencode(local.ecr_repository_policy)
}

resource "aws_ecr_lifecycle_policy" "api" {
  repository = aws_ecr_repository.api.name
  policy     = jsonencode(local.ecr_lifecycle_policy)
}
