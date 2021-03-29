#!/bin/bash

set -e

# Zip each lambda file individually
LAMBDA_PATH=incoming-message-handler/build

zip $LAMBDA_PATH/formatMessage.zip $LAMBDA_PATH/formatMessage.js
zip $LAMBDA_PATH/logMessageReceipt.zip $LAMBDA_PATH/logMessageReceipt.js
zip $LAMBDA_PATH/parseMessage.zip $LAMBDA_PATH/parseMessage.js
zip $LAMBDA_PATH/retrieveFromS3.zip $LAMBDA_PATH/retrieveFromS3.js
zip $LAMBDA_PATH/sendToBichard.zip $LAMBDA_PATH/sendToBichard.js

# Upload all artifacts to the S3 bucket
aws s3 cp ./incoming-message-handler/build/ s3://$S3_BUCKET/audit-logging/ --recursive --exclude "*" --include "*.zip"
aws s3 cp ./incoming-message-handler/scripts/state-machine.json.tpl s3://$S3_BUCKET/audit-logging/state-machine.json.tpl
