#!/usr/bin/env bash

set -evx

yum install -y jq

readonly REPOSITORY_NAME="audit-log-portal"
readonly SOURCE_REPOSITORY_NAME="nginx-nodejs-supervisord"
readonly REPOSITORY="${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-2.amazonaws.com"
readonly DOCKER_IMAGE_PREFIX="${REPOSITORY}/${REPOSITORY_NAME}"
readonly SOURCE_IMAGE_PREFIX="${REPOSITORY}/${SOURCE_REPOSITORY_NAME}"

echo "Build ${REPOSITORY_NAME} image on `date`"

aws ecr get-login-password --region eu-west-2 | docker login \
  --username AWS \
  --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.eu-west-2.amazonaws.com

IMAGE_HASH=$(aws ecr describe-images --repository-name ${SOURCE_REPOSITORY_NAME} | jq '.imageDetails|sort_by(.imagePushedAt)[-1].imageDigest' | tr -d '"')

DOCKER_IMAGE_HASH="${SOURCE_IMAGE_PREFIX}@${IMAGE_HASH}"
echo "Building from ${DOCKER_IMAGE_HASH}"

docker build --build-arg "NODE_IMAGE=${DOCKER_IMAGE_HASH}" -t ${REPOSITORY_NAME} .

install_trivy() {
  echo "Pulling trivy binary from s3"
  aws s3 cp \
    s3://"${ARTIFACT_BUCKET}"/trivy/binary/trivy_latest_Linux-64bit.rpm \
    .

  echo "Installing trivy binary"
  rpm -ivh trivy_latest_Linux-64bit.rpm
}

pull_trivy_db() {
  echo "Pulling trivy db from s3..."
  aws s3 cp \
    s3://"${ARTIFACT_BUCKET}"/trivy/db/trivy-offline.db.tgz \
    trivy/db/

  echo "Extracting trivy db to `pwd`/trivy/db/"
  tar -xvf trivy/db/trivy-offline.db.tgz -C trivy/db/
}

pull_goss_binary() {
  echo "Pulling goss binary"
  aws s3 cp \
    s3://"${ARTIFACT_BUCKET}"/goss/goss \
    /usr/local/bin/goss

  chmod +rx /usr/local/bin/goss
}

pull_dgoss_binary() {
  echo "Pulling dgoss binary"
  aws s3 cp \
    s3://"${ARTIFACT_BUCKET}"/dgoss/dgoss \
    /usr/local/bin/dgoss

  chmod +rx /usr/local/bin/dgoss
}

mkdir -p trivy/db
install_trivy
pull_trivy_db
pull_goss_binary
export GOSS_PATH="/usr/local/bin/goss"
pull_dgoss_binary

## Run goss tests
GOSS_SLEEP=15 dgoss run -e API_URL=xxx "${REPOSITORY_NAME}:latest"

## Run Trivy scan
TRIVY_CACHE_DIR=trivy trivy image \
  --exit-code 1 \
  --severity "CRITICAL" \
  --skip-update "${REPOSITORY_NAME}:latest" # we have the most recent db pulled locally

docker tag "${REPOSITORY_NAME}:latest" ${DOCKER_IMAGE_PREFIX}:${CODEBUILD_RESOLVED_SOURCE_VERSION}-${CODEBUILD_START_TIME}
echo "Push Docker image on `date`"
docker push ${DOCKER_IMAGE_PREFIX}:${CODEBUILD_RESOLVED_SOURCE_VERSION}-${CODEBUILD_START_TIME} | tee /tmp/docker.out
export IMAGE_SHA_HASH=$(cat /tmp/docker.out | grep digest | cut -d':' -f3-4 | cut -d' ' -f2)

if [ "${IS_CD}" = "true" ]; then
  cat <<EOF>/tmp/audit-logging.json
  {
    "source-hash" : "${CODEBUILD_RESOLVED_SOURCE_VERSION}",
    "build-time": "${CODEBUILD_START_TIME}",
    "image-hash": "${IMAGE_SHA_HASH}"
 }
EOF

  aws s3 cp /tmp/audit-logging.json s3://${ARTIFACT_BUCKET}/semaphores/audit-logging.json
  export AUDIT_LOGGING_HASH="${IMAGE_SHA_HASH}"

fi
