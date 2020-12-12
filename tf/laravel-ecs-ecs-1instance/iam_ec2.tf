# ################################################
# ## apiのinstance用のユーザー
# ################################################
data "aws_iam_policy" "AmazonEC2ContainerServiceforEC2Role" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

data "aws_iam_policy" "AmazonEC2RoleforSSM" {
  arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforSSM"
}

# @TODO: 接続可能なインスタンスを絞る
resource "aws_iam_role" "api" {
  name = "api_ec2_role"
  assume_role_policy = jsonencode(
    {
      "Version" : "2012-10-17",
      "Statement" : [
        {
          "Action" : "sts:AssumeRole",
          "Principal" : {
            "Service" : "ec2.amazonaws.com",
          },
          "Effect" : "Allow",
          "Sid" : "",
        },
      ]
    }
  )
}

resource "aws_iam_role_policy_attachment" "api_ec2" {
  policy_arn = data.aws_iam_policy.AmazonEC2ContainerServiceforEC2Role.arn
  role       = aws_iam_role.api.name
}

resource "aws_iam_role_policy_attachment" "api_ec2_ssm" {
  policy_arn = data.aws_iam_policy.AmazonEC2RoleforSSM.arn
  role       = aws_iam_role.api.name
}
