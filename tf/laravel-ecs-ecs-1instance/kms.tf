resource "aws_kms_key" "api" {
  description             = "api task master key"
  deletion_window_in_days = 10
}

resource "aws_kms_alias" "api" {
  name          = "alias/laravel-ecs-ec2-1instance"
  target_key_id = aws_kms_key.api.key_id
}
