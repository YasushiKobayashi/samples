resource "aws_security_group" "api" {
  name        = "api_ec2"
  description = "api_ec2"
  tags = {
    Name = "api_ec2"
  }
  vpc_id = aws_vpc.api.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "api_ec2_http" {
  type                     = "ingress"
  from_port                = 0
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.api.id
}

