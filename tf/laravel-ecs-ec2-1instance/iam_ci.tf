# ################################################
# ## apiのci用のユーザー
# ################################################
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
