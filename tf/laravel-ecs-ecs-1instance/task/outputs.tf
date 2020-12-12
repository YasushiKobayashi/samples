output "ecs_cluster_api" {
  value = aws_ecs_cluster.api
}

output "ecs_service_api" {
  value = aws_ecs_service.api
}

output "ecs_task_api" {
  value = aws_ecs_task_definition.api
}
