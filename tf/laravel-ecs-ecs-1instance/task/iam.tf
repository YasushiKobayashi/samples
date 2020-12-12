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
  name               = "api_ecs_task_role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role_policy.json
  path               = "/"
}

# ssm parameter
resource "aws_iam_role_policy" "ssm_parameter" {
  name = "api_ssm_paramer"
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

# kms
resource "aws_iam_role_policy" "kms" {
  name = "api_kms"
  role = aws_iam_role.api.id
  policy = jsonencode({
    Statement = [
      {
        "Action" : [
          "kms:*",
        ],
        "Effect" : "Allow",
        "Resource" : [
          aws_kms_key.api_task.arn
        ]
      }
    ]
    Version = "2012-10-17"
  })
}

# ecs task
resource "aws_iam_role_policy_attachment" "task_role" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
  role       = aws_iam_role.api.name
}

# cloud watch
resource "aws_iam_role_policy" "cloud_watch_logs" {
  name = "api_cloud-watch-logs"
  role = aws_iam_role.api.id
  policy = jsonencode({
    Statement = [
      {
        "Action" : [
          "logs:CreateLogGroup",
          "logs:DescribeLogStreams",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ],
        "Effect" : "Allow",
        "Resource" : [
          "*"
        ]
      }
    ]
    Version = "2012-10-17"
  })
}
