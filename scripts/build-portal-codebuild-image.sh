#!/usr/bin/env bash

set -e

readonly REPOSITORY_NAME="audit-log-portal"
readonly SOURCE_REPOSITORY_NAME="nginx-nodejs-supervisord"
readonly REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-2.amazonaws.com"
readonly DOCKER_IMAGE_PREFIX="${REPOSITORY}/${REPOSITORY_NAME}"
readonly SOURCE_IMAGE_PREFIX="${REPOSITORY}/${SOURCE_REPOSITORY_NAME}"

echo "Build ${REPOSITORY_NAME} image on `date`"

aws ecr get-login-password --region eu-west-2 | docker login \
  --username AWS \
  --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-2.amazonaws.com

IMAGE_HASH=$(aws ecr describe-images \
  --repository-name ${SOURCE_REPOSITORY_NAME}\
  --query 'to_string(sort_by(imageDetails,& imagePushedAt)[-1].imageDigest)'
)

IMAGE_HASH=$(echo $IMAGE_HASH | tr -d '"')
DOCKER_IMAGE_HASH="${SOURCE_IMAGE_PREFIX}@${IMAGE_HASH}"
echo "Building from ${DOCKER_IMAGE_HASH}"

docker build --build-arg "NODE_IMAGE=${DOCKER_IMAGE_HASH}" -t ${REPOSITORY_NAME} .

docker tag ${REPOSITORY_NAME}:latest ${DOCKER_IMAGE_PREFIX}:${CODEBUILD_RESOLVED_SOURCE_VERSION}-${CODEBUILD_START_TIME}

echo "Push Docker image on `date`"
docker push ${DOCKER_IMAGE_PREFIX}:${CODEBUILD_RESOLVED_SOURCE_VERSION}-${CODEBUILD_START_TIME}

if [ "${IS_CD}" = "true" ]; then
  echo "Starting build ${DEPLOY_JOB_NAME}"
  aws codebuild start-build --project-name "${DEPLOY_JOB_NAME}"
fi
