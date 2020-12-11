data "aws_iam_policy_document" "ecs_task_execution_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "api" {
  name = "api_ecs_task_stg_role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role_policy.json
  path               = "/"
}

resource "aws_iam_role_policy" "ssm_parameter" {
  role = aws_iam_role.api.id
  policy = jsonencode({
    Statement = [
      {
        "Action" : [
          "ssm:GetParameters",
        ],
        "Effect" : "Allow",
        "Resource" : [
          aws_ssm_parameter.db_username.arn,
          aws_ssm_parameter.db_password.arn,
        ]
      },
    ]
    Version = "2012-10-17"
  })
}
