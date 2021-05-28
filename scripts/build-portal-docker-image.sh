#!/usr/bin/env bash

set -e

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    echo "AWS_ACCOUNT_ID is not set!" >&2
    exit 1
fi

echo "Building Audit Log Portal Docker Image on $(date)"

# Get our latest staged nodejs image
IMAGE_HASH=$(aws ecr describe-images \
    --repository-name nodejs \
    --query 'to_string(sort_by(imageDetails,& imagePushedAt)[-1].imageDigest)'
)

IMAGE_HASH=$(echo $IMAGE_HASH | tr -d '"')
DOCKER_IMAGE_HASH="$AWS_ACCOUNT_ID.dkr.ecr.eu-west-2.amazonaws.com/nodejs@$IMAGE_HASH"

docker build --build-arg "NODE_IMAGE=$DOCKER_IMAGE_HASH" -t audit-log-portal:latest .
