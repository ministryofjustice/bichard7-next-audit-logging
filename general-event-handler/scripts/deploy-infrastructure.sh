#!/bin/bash

set -e

function create_lambda {
  local lambda_name=$1
  local handler_name=$2

  if ! awslocal lambda list-functions | grep -q "$lambda_name"; then
    LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
      --function-name "$lambda_name" \
      --code S3Bucket="__local__",S3Key="$PWD/build" \
      --handler "$handler_name" \
      --runtime nodejs12.x \
      --role whatever
  fi

  # Configure the lambda with environment variables
  awslocal lambda update-function-configuration \
    --function-name "$lambda_name" \
    --environment file://"$PWD"/scripts/env-vars.json
}

create_lambda "GeneralEventHandler" "generalEventHandler.default"
