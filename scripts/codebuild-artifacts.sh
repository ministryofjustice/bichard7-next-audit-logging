#!/bin/bash

set -e

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

cd -

# Upload all artifacts to the S3 bucket
aws s3 cp \
  ./incoming-message-handler/build/ \
  s3://$S3_BUCKET/audit-logging/ \
  --recursive \
  --exclude "*" \
  --include "*.zip" \
  --acl bucket-owner-full-control

aws s3 cp \
  ./incoming-message-handler/scripts/state-machine.json.tpl \
  s3://$S3_BUCKET/audit-logging/state-machine.json.tpl \
  --acl bucket-owner-full-control

############################################
# Audit Log API
############################################

# Zip each lambda file individually
cd audit-log-api/build

zip getMessages.zip getMessages.js
zip createAuditLog.zip createAuditLog.js

cd -

# Upload all artifacts to the S3 bucket
aws s3 cp \
  ./audit-log-api/build/ \
  s3://$S3_BUCKET/audit-logging/ \
  --recursive \
  --exclude "*" \
  --include "*.zip" \
  --acl bucket-owner-full-control
