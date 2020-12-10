#!/bin/sh
aws kms encrypt \
  --key-id alias/laravel-ecs-ec2-1instance \
  --plaintext $1 \
  --output text \
  --query CiphertextBlob > ./test.txt
