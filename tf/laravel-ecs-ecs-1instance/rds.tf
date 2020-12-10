data "aws_kms_secrets" "rds" {
  secret {
    name    = "root_username"
    payload = "xxx"
  }
  secret {
    name    = "root_password"
    payload = "xxx"
  }
}
