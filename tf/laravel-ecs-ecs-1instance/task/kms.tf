resource "aws_kms_key" "api_task" {
  description             = "api task master key"
  deletion_window_in_days = 10
}

resource "aws_kms_alias" "api_task" {
  name          = "alias/laravel-ecs-ec2-1instance_task"
  target_key_id = aws_kms_key.api_task.key_id
}

data "aws_kms_secrets" "ecs" {
  secret {
    name    = "db_username"
    payload = "AQICAHgLj4ep5Juu2IoyOya2TVUGj+0Nc7X/Akpzj7PLRA8H5gGIHKHMd7XO8oiSaIJoDBAXAAAAZjBkBgkqhkiG9w0BBwagVzBVAgEAMFAGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQM7f00AjIQ4aopf4cxAgEQgCO4B2LvvOuUTlPh2EShQPX6+mULUFFvlaYQKwY6tqoUV0T7Mw=="
  }

  secret {
    name    = "db_password"
    payload = "AQICAHgLj4ep5Juu2IoyOya2TVUGj+0Nc7X/Akpzj7PLRA8H5gHh7YZ19KYm+Ddamm4l18qhAAAAaTBnBgkqhkiG9w0BBwagWjBYAgEAMFMGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMeRE61bSvO+yuGAYUAgEQgCaBDCy+OSVjfAr93mgPKLT+XARjOYyzx6qeMsquvlx+L3DdKmWHXg=="
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

