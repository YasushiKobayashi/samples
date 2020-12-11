data "aws_kms_secrets" "rds" {
  secret {
    name    = "root_username"
    payload    = "AQICAHgu1ESf7ghxqox5ud+3uLa0u1G9BsOif/zPd9Be97hOPgG40GQBcoE6DPiRVVSd+zIzAAAAYjBgBgkqhkiG9w0BBwagUzBRAgEAMEwGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMh+ky55ybrqkQChceAgEQgB/ARx3BkeeESAfmAo4EKUcTShA8jpun3dXbHXu5tpJn"
  }
  secret {
    name    = "root_password"
    payload = "AQICAHgu1ESf7ghxqox5ud+3uLa0u1G9BsOif/zPd9Be97hOPgE4ffShCsh2pBzx4/91tOGgAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMME0pT5D+AzKJlx6IAgEQgDvWJXmRTO1EfP6EOAjCsGgF1fbdl8xQ88CWNSmoW5JUS10Ee2dTuhNamA82FGc0GqfurrXOB7UA+kxTWg=="
  }
}

resource "aws_db_subnet_group" "api" {
  name = var.app_name
  subnet_ids = [
    aws_subnet.api_1.id, aws_subnet.api_2.id, aws_subnet.api_3.id
  ]
}

resource "aws_db_instance" "api" {
  identifier             = var.app_name
  allocated_storage      = 20
  storage_type           = "gp2"
  engine                 = "mysql"
  engine_version         = "8.0.20"
  instance_class         = "db.t3.micro"
  name                   = "app"
  username               = data.aws_kms_secrets.rds.plaintext["root_username"]
  password               = data.aws_kms_secrets.rds.plaintext["root_password"]
  vpc_security_group_ids = [aws_security_group.api_db.id]
  db_subnet_group_name   = aws_db_subnet_group.api.name
  skip_final_snapshot    = true
}

resource "aws_security_group" "api_db" {
  name        = "api"
  description = "api"
  tags = {
    Name = "stg_api_db"
  }
  vpc_id = aws_vpc.api.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "api_db" {
  type                     = "ingress"
  from_port                = 3306
  to_port                  = 3306
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.api.id
  security_group_id        = aws_security_group.api_db.id
}
