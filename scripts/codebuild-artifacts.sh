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
  aws s3 cp "$sourceFilename" \
    "s3://$ARTIFACT_BUCKET/audit-logging/$destinationFilename" \
    --content-type "$contentType" \
    --acl bucket-owner-full-control \
    --metadata hash="$sourceHash"
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
# Message Receiver
############################################

cd src/message-receiver/build

zip messageReceiver.zip messageReceiver.js
upload_to_s3 messageReceiver.zip messageReceiver.zip

cd -

############################################
# Transfer Messages
############################################

cd src/transfer-messages/build

zip transferMessages.zip transferMessages.js
upload_to_s3 transferMessages.zip transferMessages.zip

cd -

############################################
# Archive User Logs
############################################

cd src/archive-user-logs/build

zip archiveUserLogs.zip archiveUserLogs.js
upload_to_s3 archiveUserLogs.zip archiveUserLogs.zip

cd -

############################################
# Incoming Message Handler
############################################

cd src/incoming-message-handler/build

zip formatMessage.zip formatMessage.js
zip logMessageReceipt.zip logMessageReceipt.js
zip parseMessage.zip parseMessage.js
zip retrieveFromS3.zip retrieveFromS3.js
zip sendToBichard.zip sendToBichard.js
zip recordSentToBichardEvent.zip recordSentToBichardEvent.js

# Upload all artifacts to the S3 bucket
upload_to_s3 formatMessage.zip formatMessage.zip
upload_to_s3 logMessageReceipt.zip logMessageReceipt.zip
upload_to_s3 parseMessage.zip parseMessage.zip
upload_to_s3 retrieveFromS3.zip retrieveFromS3.zip
upload_to_s3 sendToBichard.zip sendToBichard.zip
upload_to_s3 recordSentToBichardEvent.zip recordSentToBichardEvent.zip

cd -

upload_to_s3 "./src/incoming-message-handler/scripts/state-machine.json.tpl" "incoming-message-handler-state-machine.json.tpl" "application/json"

############################################
# Audit Log API
############################################

# Zip each lambda file individually
cd src/audit-log-api/build

zip getMessages.zip getMessages.js
zip createAuditLog.zip createAuditLog.js
zip createAuditLogEvent.zip createAuditLogEvent.js
zip getEvents.zip getEvents.js
zip retryMessage.zip retryMessage.js

upload_to_s3 getMessages.zip getMessages.zip
upload_to_s3 createAuditLog.zip createAuditLog.zip
upload_to_s3 createAuditLogEvent.zip createAuditLogEvent.zip
upload_to_s3 getEvents.zip getEvents.zip
upload_to_s3 retryMessage.zip retryMessage.zip

cd -

############################################
# Event Handler
############################################

cd src/event-handler/build

zip storeEvent.zip storeEvent.js

# Upload all artifacts to the S3 bucket
upload_to_s3 storeEvent.zip storeEvent.zip

cd -

upload_to_s3 "src/event-handler/scripts/state-machine.json.tpl" "event-handler-state-machine.json.tpl" "application/json"

############################################
# Retry Failed Messages
############################################

cd src/retry-failed-messages/build

zip retryFailedMessages.zip retryFailedMessages.js
upload_to_s3 retryFailedMessages.zip retryFailedMessages.zip

cd -

############################################
# Audit Log Portal
############################################

# Build the Portal Docker Image
make codebuild-portal-image
