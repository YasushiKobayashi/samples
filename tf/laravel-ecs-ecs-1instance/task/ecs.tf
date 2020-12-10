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
