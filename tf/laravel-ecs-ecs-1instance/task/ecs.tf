resource "aws_ecs_capacity_provider" "api" {
  name = var.app_name

  auto_scaling_group_provider {
    auto_scaling_group_arn         = data.terraform_remote_state.api.outputs.autoscaling_group_api.arn
    managed_termination_protection = "DISABLED"

    managed_scaling {
      maximum_scaling_step_size = 100
      minimum_scaling_step_size = 1
      target_capacity           = 100
      status                    = "ENABLED"
    }
  }
}

resource "aws_ecs_cluster" "api" {
  name               = var.app_name
  capacity_providers = [aws_ecs_capacity_provider.api.name]

  default_capacity_provider_strategy {
    base              = 0
    weight            = 1
    capacity_provider = aws_ecs_capacity_provider.api.name
  }
}

resource "aws_ecs_service" "api" {
  name            = var.app_name
  task_definition = aws_ecs_task_definition.api.arn
  cluster         = aws_ecs_cluster.api.arn
  launch_type     = "EC2"
  desired_count   = 1
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200

  load_balancer {
    target_group_arn = data.terraform_remote_state.api.outputs.alb_target_group_api.arn
    container_name   = var.nginx_container_name
    container_port   = 80
  }
}
