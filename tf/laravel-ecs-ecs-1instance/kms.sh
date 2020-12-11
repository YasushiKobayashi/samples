#!/bin/bash
echo -n $1 > enc.txt
aws kms encrypt \
  --key-id alias/laravel-ecs-ec2-1instance \
  --plaintext fileb://enc.txt \
  --query CiphertextBlob \
  --output text > test.txt
