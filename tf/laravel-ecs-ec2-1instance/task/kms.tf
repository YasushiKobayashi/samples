resource "aws_kms_key" "api_task" {
  description             = "api task master key"
  enable_key_rotation     = true
  deletion_window_in_days = 10
}

resource "aws_kms_alias" "api_task" {
  name          = "alias/laravel-ecs-ec2-1instance_task"
  target_key_id = aws_kms_key.api_task.key_id
}

data "aws_kms_secrets" "ecs" {
  secret {
    name    = "db_username"
    payload = "AQICAHgLj4ep5Juu2IoyOya2TVUGj+0Nc7X/Akpzj7PLRA8H5gHHj95drRcee+XWxY4dPmpEAAAAYjBgBgkqhkiG9w0BBwagUzBRAgEAMEwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM0bZUh8aPvUQFf9I/AgEQgB8fs0JSsRVFEjD/sVQD46XGY4zpS8/RFQRSR2/uBPjE"
  }

  secret {
    name    = "db_password"
    payload = "AQICAHgLj4ep5Juu2IoyOya2TVUGj+0Nc7X/Akpzj7PLRA8H5gGU0f1iUREC3dd9tMxLe3gwAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMriPheQbhTfHQskanAgEQgDsVP7zA8FZyprV9IeVi/E1CsCxHCt24R+PbWdcxR2Ppw5RrKi8b1kUtS6Z4muLcs4tCN8pDD2FSDutQig=="
  }
}


resource "aws_ssm_parameter" "db_username" {
  name   = "/prod/api/db_username"
  type   = "SecureString"
  key_id = aws_kms_key.api_task.id
  value  = data.aws_kms_secrets.ecs.plaintext["db_username"]
}

resource "aws_ssm_parameter" "db_password" {
  name   = "/prod/api/db_password"
  type   = "SecureString"
  key_id = aws_kms_key.api_task.id
  value  = data.aws_kms_secrets.ecs.plaintext["db_password"]
}

