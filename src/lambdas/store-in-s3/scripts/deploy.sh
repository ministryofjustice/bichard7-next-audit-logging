#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"

# Make sure the S3 bucket exists
BUCKET_NAME=store-in-s3
TMP_ENV_VARS=/tmp/store-in-s3-env-vars.json

cat "$PWD/scripts/env-vars.json.tpl" | sed "s/{EVENTS_BUCKET_NAME}/$BUCKET_NAME/g" > "$TMP_ENV_VARS"

awslocal s3 mb "s3://$BUCKET_NAME"

# Create the lambda
create_lambda "store-in-s3" "storeInS3.default" "$TMP_ENV_VARS"

rm "$TMP_ENV_VARS"
