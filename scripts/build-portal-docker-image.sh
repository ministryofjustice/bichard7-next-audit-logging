#!/usr/bin/env bash

set -e

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
  AWS_ACCOUNT_ID=$(aws sts get-caller-identity \
    --query 'Account' \
    --output text
  )
fi

if [[ -z "$AWS_REGION" ]]; then
  AWS_REGION=$(env | grep "AWS_REGION" | sed -e "s/AWS_REGION=//g")
fi

if [[ -z "$AWS_REGION" ]]; then
  echo "AWS_REGION is not set and cannot be determined"
  exit 1
fi

echo "Using account $AWS_ACCOUNT_ID and region $AWS_REGION"

aws ecr get-login-password --region "$AWS_REGION" | docker login \
  --username AWS \
  --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "Building Audit Log Portal Docker Image on $(date)"

# Get our latest staged nodejs image
IMAGE_HASH=$(aws ecr describe-images \
    --repository-name nginx-nodejs-supervisord \
    --query 'to_string(sort_by(imageDetails,& imagePushedAt)[-1].imageDigest)'
)

IMAGE_HASH=$(echo $IMAGE_HASH | tr -d '"')
DOCKER_IMAGE_HASH="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/nodejs@$IMAGE_HASH"

docker build --build-arg "NODE_IMAGE=$DOCKER_IMAGE_HASH" -t audit-log-portal:latest .
