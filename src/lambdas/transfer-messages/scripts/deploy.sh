#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"

# Make sure the S3 bucket exists
EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME=external-incoming-messages
INTERNAL_INCOMING_MESSAGE_BUCKET_NAME=incoming-messages
TMP_ENV_VARS=/tmp/transfer-messages-env-vars.json

cat "$PWD/scripts/env-vars.json.tpl" | 
  sed "s/{EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME}/$EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME/g" |
  sed "s/{INTERNAL_INCOMING_MESSAGE_BUCKET_NAME}/$INTERNAL_INCOMING_MESSAGE_BUCKET_NAME/g" > "$TMP_ENV_VARS"

awslocal s3 mb "s3://$EXTERNAL_INCOMING_MESSAGE_BUCKET_NAME"
awslocal s3 mb "s3://$INTERNAL_INCOMING_MESSAGE_BUCKET_NAME"

# Create the lambda
create_lambda "transfer-messages" "transferMessages.default" "$TMP_ENV_VARS"

rm "$TMP_ENV_VARS"
