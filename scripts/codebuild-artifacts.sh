#!/bin/bash

set -e

# Zip each lambda file individually
FILES=(
  formatMessage
  logMessageReceipt
  parseMessage
  retrieveFromS3
  sendToBichard
)

for FILE in ${FILES[@]}; do
  zip $FILE.zip $FILE.js
done

# Upload all artifacts to the S3 bucket
aws s3 cp ./incoming-message-handler/build/ s3://$S3_BUCKET/audit-logging/ --recursive --exclude "*" --include "*.zip"
aws s3 cp ./incoming-message-handler/scripts/state-machine.json.tpl s3://$S3_BUCKET/audit-logging/state-machine.json.tpl
