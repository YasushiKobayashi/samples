data "aws_acm_certificate" "api" {
  domain = var.domain
  types  = ["AMAZON_ISSUED"]
}

resource "aws_alb" "api" {
  name            = var.app_name
  security_groups = [aws_security_group.alb.id]

  subnets = [
    aws_subnet.api_1.id,
    aws_subnet.api_2.id,
    aws_subnet.api_3.id,
  ]

  tags = {
    Service = "api"
  }
}

resource "aws_alb_target_group" "api" {
  name                 = var.app_name
  port                 = 80
  protocol             = "HTTP"
  vpc_id               = aws_vpc.api.id
  deregistration_delay = 30

  health_check {
    interval            = 30
    path                = "/"
    protocol            = "HTTP"
    timeout             = 10
    healthy_threshold   = 2
    unhealthy_threshold = 4
    matcher             = 200
  }

  tags = {
    Service = "api"
  }
}

resource "aws_alb_listener" "api_http" {
  load_balancer_arn = aws_alb.api.id
  port              = "80"
  protocol          = "HTTP"

  default_action {
    target_group_arn = aws_alb_target_group.api.id
    type             = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_alb_listener" "api_https" {
  load_balancer_arn = aws_alb.api.id
  port              = "443"
  protocol          = "HTTPS"
  certificate_arn   = data.aws_acm_certificate.api.arn

  default_action {
    target_group_arn = aws_alb_target_group.api.id
    type             = "forward"
  }
}

resource "aws_security_group" "alb" {
  name        = "api_alb"
  description = "api_alb"
  tags = {
    Name = "api_alb"
  }
  vpc_id = aws_vpc.api.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group_rule" "alb_http" {
  description = "alb_http"
  type        = "ingress"
  from_port   = 80
  to_port     = 80
  protocol    = "tcp"
  cidr_blocks = [
    "0.0.0.0/0",
  ]
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_https" {
  description = "alb_https"
  type      = "ingress"
  from_port = 443
  to_port   = 443
  protocol  = "tcp"
  cidr_blocks = [
    "0.0.0.0/0",
  ]
  security_group_id = aws_security_group.alb.id
}
