#!/bin/bash

set -e

function upload_to_s3 {
  local sourceFilename=$1
  local destinationFilename=$2
  local contentType=$3

  if [[ -z "$contentType" ]]; then
    contentType="application/octet-stream"
  fi

  sourceHash=$(openssl dgst -binary -sha256 "$sourceFilename" | openssl base64)
  commitHashInPath="/$CODEBUILD_RESOLVED_SOURCE_VERSION"

  if [[ -z "$IS_CD" ]]; then
    commitHashInPath=""
  fi

  aws s3 cp "$sourceFilename" \
    "s3://$ARTIFACT_BUCKET/audit-logging$commitHashInPath/$destinationFilename" \
    --content-type "$contentType" \
    --acl bucket-owner-full-control \
    --metadata hash="$sourceHash"
}

############################################
# Message Receiver
############################################

cd build/message-receiver
mv index.js messageReceiver.js
zip messageReceiver.zip messageReceiver.js
upload_to_s3 messageReceiver.zip messageReceiver.zip

cd -

############################################
# Transfer Messages
############################################

cd build/transfer-messages
mv index.js transferMessages.js
zip transferMessages.zip transferMessages.js
upload_to_s3 transferMessages.zip transferMessages.zip

cd -

############################################
# Archive User Logs
############################################

cd build/archive-user-logs
mv index.js archiveUserLogs.js
zip archiveUserLogs.zip archiveUserLogs.js
upload_to_s3 archiveUserLogs.zip archiveUserLogs.zip

cd -

############################################
# Audit Log API
############################################

# Zip each lambda file individually
cd build/audit-log-api/handlers

zip getMessages.zip getMessages.js
zip createAuditLog.zip createAuditLog.js
zip createAuditLogEvents.zip createAuditLogEvents.js
zip retryMessage.zip retryMessage.js
zip sanitiseMessage.zip sanitiseMessage.js
zip createAuditLogUserEvents.zip createAuditLogUserEvents.js

upload_to_s3 getMessages.zip getMessages.zip
upload_to_s3 createAuditLog.zip createAuditLog.zip
upload_to_s3 createAuditLogEvents.zip createAuditLogEvents.zip
upload_to_s3 retryMessage.zip retryMessage.zip
upload_to_s3 sanitiseMessage.zip sanitiseMessage.zip
upload_to_s3 createAuditLogUserEvents.zip createAuditLogUserEvents.zip

cd -

############################################
# Event Handler
############################################

cd build/event-handler/handlers

zip storeEvent.zip storeEvent.js

# Upload all artifacts to the S3 bucket
upload_to_s3 storeEvent.zip storeEvent.zip

cd -

############################################
# Retry Failed Messages
############################################

cd build/retry-failed-messages
mv index.js retryFailedMessages.js
zip retryFailedMessages.zip retryFailedMessages.js
upload_to_s3 retryFailedMessages.zip retryFailedMessages.zip

cd -

############################################
# Add Archival Events
############################################

cd build/add-archival-events
mv index.js addArchivalEvents.js
zip addArchivalEvents.zip addArchivalEvents.js
upload_to_s3 addArchivalEvents.zip addArchivalEvents.zip

cd -

############################################
## Sanitise Old Messages
############################################

cd build/sanitise-old-messages
mv index.js sanitiseOldMessages.js
zip sanitiseOldMessages.zip sanitiseOldMessages.js
upload_to_s3 sanitiseOldMessages.zip sanitiseOldMessages.zip

cd -

if [ "${IS_CD}" = "true" ]; then
  cat <<EOF>/tmp/audit-logging.json
  {
    "source-hash" : "${CODEBUILD_RESOLVED_SOURCE_VERSION}",
    "build-time": "${CODEBUILD_START_TIME}",
    "image-hash": "sha256:4e09203e829a61d53e1052fe856bfcd91558dfb678746aa23a26a24d707766f1"
 }
EOF
  aws s3 cp /tmp/audit-logging.json s3://${ARTIFACT_BUCKET}/semaphores/audit-logging.json
fi
