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

## Install goss/trivy
if [ ! -f "/usr/local/bin/goss" ]; then
  curl -L https://github.com/aelsabbahy/goss/releases/latest/download/goss-linux-amd64 -o /usr/local/bin/goss
  chmod +rx /usr/local/bin/goss
fi
if [ ! -f "/usr/local/bin/dgoss" ]; then
  curl -L https://github.com/aelsabbahy/goss/releases/latest/download/dgoss -o /usr/local/bin/dgoss
  chmod +rx /usr/local/bin/dgoss
fi

get_latest_release() {
  curl --silent "https://api.github.com/repos/$1/releases/latest" | # Get latest release from GitHub api
    grep '"tag_name":' |                                            # Get tag line
    sed -E 's/.*"([^"]+)".*/\1/'                                    # Pluck JSON value
}

install_trivy() {
  echo "Installing trivy binary"
  TRIVY_VERSION=$(get_latest_release "aquasecurity/trivy" | sed 's/v//')
  yum install -y https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}/trivy_${TRIVY_VERSION}_Linux-64bit.rpm
}

install_trivy

## Run goss tests
GOSS_SLEEP=15 dgoss run e API_URL=xxx ${REPOSITORY_NAME}:latest
## Run Trivy scan
trivy image ${REPOSITORY_NAME}:latest

echo "Push Docker image on `date`"
docker push ${DOCKER_IMAGE_PREFIX}:${CODEBUILD_RESOLVED_SOURCE_VERSION}-${CODEBUILD_START_TIME}

if [ "${IS_CD}" = "true" ]; then
  echo "Starting build ${DEPLOY_JOB_NAME}"
  aws codebuild start-build --project-name "${DEPLOY_JOB_NAME}"
fi
