resource "aws_vpc" "api" {
  cidr_block = "172.32.0.0/16"

  tags = {
    Name = "api"
  }
}

resource "aws_subnet" "api_1" {
  cidr_block = "172.32.16.0/20"
  vpc_id = aws_vpc.api.id
  map_public_ip_on_launch = true

  tags = {
    Name = "api_1"
  }
}

resource "aws_subnet" "api_2" {
  cidr_block = "172.32.0.0/20"
  vpc_id = aws_vpc.api.id
  map_public_ip_on_launch = true

  tags = {
    Name = "api_2"
  }
}

resource "aws_subnet" "api_3" {
  cidr_block = "172.32.32.0/20"
  vpc_id = aws_vpc.api.id
  map_public_ip_on_launch = true

  tags = {
    Name = "api_3"
  }
}
