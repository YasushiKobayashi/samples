resource "aws_internet_gateway" "api" {
  vpc_id = aws_vpc.api.id

  tags = {
    Name = "api"
  }
}

resource "aws_vpc" "api" {
  cidr_block = "172.32.0.0/16"

  tags = {
    Name = "api"
  }
}

resource "aws_subnet" "api_1" {
  cidr_block              = "172.32.16.0/20"
  vpc_id                  = aws_vpc.api.id
  map_public_ip_on_launch = true

  tags = {
    Name = "api_1"
  }
}

resource "aws_subnet" "api_2" {
  cidr_block              = "172.32.0.0/20"
  vpc_id                  = aws_vpc.api.id
  map_public_ip_on_launch = true

  tags = {
    Name = "api_2"
  }
}

resource "aws_subnet" "api_3" {
  cidr_block              = "172.32.32.0/20"
  vpc_id                  = aws_vpc.api.id
  map_public_ip_on_launch = true

  tags = {
    Name = "api_3"
  }
}

resource "aws_route_table" "api" {
  vpc_id = aws_vpc.api.id

  tags = {
    Name = "api"
  }
}

resource "aws_route" "public" {
  destination_cidr_block = "0.0.0.0/0"
  route_table_id         = aws_route_table.api.id
  gateway_id             = aws_internet_gateway.api.id
}

resource "aws_route_table_association" "public_1a" {
  subnet_id      = aws_subnet.api_1.id
  route_table_id = aws_route_table.api.id
}

resource "aws_route_table_association" "public_1c" {
  subnet_id      = aws_subnet.api_2.id
  route_table_id = aws_route_table.api.id
}

resource "aws_route_table_association" "public_1d" {
  subnet_id      = aws_subnet.api_3.id
  route_table_id = aws_route_table.api.id
}
