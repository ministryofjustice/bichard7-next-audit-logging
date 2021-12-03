#!/bin/bash

set -e

ARTIFACT_BUCKET_NAME="${ARTIFACT_BUCKET}"

if [[ -z "${ARTIFACT_BUCKET_NAME}" ]]
then
  ARTIFACT_BUCKET_NAME="${S3_BUCKET}"
fi

function upload_to_s3 {
  local sourceFilename=$1
  local destinationFilename=$2
  local contentType=$3

  if [[ -z "$contentType" ]]; then
    contentType="application/octet-stream"
  fi

  aws s3 cp "$sourceFilename" \
    "s3://$ARTIFACT_BUCKET_NAME/audit-logging/$destinationFilename" \
    --content-type "$contentType" \
    --acl bucket-owner-full-control
}

############################################
# Lambdas
############################################

LAMBDAS=$(ls src/lambdas)

echo "Packaging each lambda..."
for lambda in ${LAMBDAS}; do
  NAME=$(echo "$lambda" | sed -r "s/(-)([a-z])/\U\2/g")

  echo "Packaging $lambda as $NAME..."
  cd "src/lambdas/$lambda/build"

  zip "$NAME.zip" "$NAME.js"

  # Upload to S3
  upload_to_s3 "$NAME.zip" "$NAME.zip"

  cd -
done

############################################
# Incoming Message Handler
############################################

# Zip each lambda file individually
cd incoming-message-handler/build

zip formatMessage.zip formatMessage.js
zip logMessageReceipt.zip logMessageReceipt.js
zip parseMessage.zip parseMessage.js
zip retrieveFromS3.zip retrieveFromS3.js
zip sendToBichard.zip sendToBichard.js
zip recordSentToBichardEvent.zip recordSentToBichardEvent.js

cd -

# Upload all artifacts to the S3 bucket
aws s3 cp \
  ./incoming-message-handler/build/ \
  s3://$ARTIFACT_BUCKET_NAME/audit-logging/ \
  --recursive \
  --exclude "*" \
  --include "*.zip" \
  --acl bucket-owner-full-control

upload_to_s3 "./incoming-message-handler/scripts/state-machine.json.tpl" "incoming-message-handler-state-machine.json.tpl" "application/json"

############################################
# Audit Log API
############################################

# Zip each lambda file individually
cd audit-log-api/build

zip getMessages.zip getMessages.js
zip createAuditLog.zip createAuditLog.js
zip createAuditLogEvent.zip createAuditLogEvent.js
zip getEvents.zip getEvents.js
zip retryMessage.zip retryMessage.js

cd -

# Upload all artifacts to the S3 bucket
aws s3 cp \
  ./audit-log-api/build/ \
  s3://$ARTIFACT_BUCKET_NAME/audit-logging/ \
  --recursive \
  --exclude "*" \
  --include "*.zip" \
  --acl bucket-owner-full-control

############################################
# Event Handler
############################################

# Zip any lambdas from the General Event Handler
upload_to_s3 "src/event-handler/scripts/state-machine.json.tpl" "event-handler-state-machine.json.tpl" "application/json"

############################################
# Audit Log Portal
############################################

# Build the Portal Docker Image
make codebuild-portal-image

