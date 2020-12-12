data "aws_ssm_parameter" "ecs_optimized_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id"
}

resource "aws_iam_instance_profile" "api" {
  role = aws_iam_role.api.name
}

resource "aws_launch_template" "api" {
  name = var.app_name
  image_id               = data.aws_ssm_parameter.ecs_optimized_ami.value
  instance_type          = "t3.small"
  vpc_security_group_ids = [aws_security_group.api.id]
  user_data = base64encode(templatefile("./userdata/userdata.sh", {
    CLUSTER_NAME = var.app_name
  }))
  lifecycle {
    create_before_destroy = true
  }

  iam_instance_profile {
    arn = aws_iam_instance_profile.api.arn
  }
}

resource "aws_autoscaling_group" "api" {
  name                      = var.app_name
  max_size                  = 1
  min_size                  = 1
  desired_capacity          = 1
  health_check_grace_period = 300
  health_check_type         = "ELB"
  force_delete              = true
  vpc_zone_identifier = [
    aws_subnet.api_1.id,
    aws_subnet.api_2.id,
    aws_subnet.api_3.id,
  ]

  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.api.id
        version            = "$Latest" # https://www.terraform.io/docs/providers/aws/r/autoscaling_group.html#version
      }
    }

    instances_distribution {
      # 今回の作成では、STG環境はspotインスタンスでいいので0/prodは100
      on_demand_percentage_above_base_capacity = 0
    }
  }

  tag {
    key                 = "Name"
    value               = var.app_name
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

