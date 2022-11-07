#!/usr/bin/env bash

set -e

readonly DOCKER_REFERENCE="nginx-nodejs-supervisord:arm"

function has_local_image() {
  IMAGES=$(docker images --filter=reference="${DOCKER_REFERENCE}" -q | wc -l)
  echo "${IMAGES}"
}

function pull_and_build_from_aws() {
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
  IMAGE_HASH=$(aws ecr describe-images --repository-name ${DOCKER_REFERENCE} | jq '.imageDetails|sort_by(.imagePushedAt)[-1].imageDigest' | tr -d '"')

  DOCKER_IMAGE_HASH="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/${DOCKER_REFERENCE}@$IMAGE_HASH"

  docker build --build-arg "NODE_IMAGE=$DOCKER_IMAGE_HASH" -t audit-log-portal:latest .
}

cd src/audit-log-portal
if [[ "$(has_local_image)" -gt 0 ]]; then
  docker build --build-arg "NODE_IMAGE=$DOCKER_REFERENCE" -t audit-log-portal:latest .
else
  pull_and_build_from_aws
fi
