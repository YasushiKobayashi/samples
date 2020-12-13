output "autoscaling_group_api" {
  value = aws_autoscaling_group.api
}

output "ecr_repository_nginx" {
  value = aws_ecr_repository.nginx
}

output "ecr_repository_api" {
  value = aws_ecr_repository.api
}

output "db_instance_api" {
  value = aws_db_instance.api
}

output "alb_target_group_api" {
  value = aws_alb_target_group.api
}
