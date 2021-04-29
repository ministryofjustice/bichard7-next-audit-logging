#! /bin/bash

source $(dirname "$0")/../../environment/audit-log-api-url.sh
set -e

SCRIPTS_PATH=$PWD/scripts

function create_lambda {
  LAMBDA_NAME=$1
  HANDLER_NAME=$2

  if [[ -z $(awslocal lambda list-functions | grep $LAMBDA_NAME) ]]; then
    LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
      --function-name $LAMBDA_NAME \
      --code S3Bucket="__local__",S3Key=$PWD/build \
      --handler $HANDLER_NAME \
      --runtime nodejs12.x \
      --role whatever
  fi

  # Configure the lambda with environment variables
  awslocal lambda update-function-configuration \
    --function-name $LAMBDA_NAME \
    --environment file://$SCRIPTS_PATH/env-vars.json
}

function update_env_vars_file {
  local env_path=$(dirname "$0")/env-vars.json
  local api_url=$(get_audit_log_api_url localstack_main)

  if [[ -z $api_url ]]; then
    echo "Failed to retrieve the API URL"
    exit 1
  fi

  cat > $env_path <<- EOM
{
  "Variables": {
    "MQ_HOST": "mq",
    "MQ_PORT": "61613",
    "MQ_QUEUE": "incoming-message-handler-e2e-testing",
    "MQ_USER": "admin",
    "MQ_PASSWORD": "admin",
    "AWS_URL": "http://localstack_main:4566",
    "AWS_REGION": "us-east-1",
    "INCOMING_MESSAGE_BUCKET_NAME": "incoming-messages",
    "S3_FORCE_PATH_STYLE": "true",
    "API_URL": "$api_url"
  }
}
EOM
}

# Update environment variables file
update_env_vars_file

# Create the lambda function
create_lambda "RetrieveFromS3" "retrieveFromS3.default"
create_lambda "FormatMessage" "formatMessage.default"
create_lambda "ParseMessage" "parseMessage.default"
create_lambda "LogMessageReceipt" "logMessageReceipt.default"
create_lambda "SendToBichard" "sendToBichard.default"

awslocal s3 mb s3://incoming-messages

# Setup the Step Function state machine to trigger our Lambda
RETRIEVE_FROM_S3_LAMBDA_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"RetrieveFromS3\"))" | \
  jq ".[0].FunctionArn" -r)

FORMAT_MESSAGE_LAMBDA_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"FormatMessage\"))" | \
  jq ".[0].FunctionArn" -r)

PARSE_MESSAGE_LAMBDA_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"ParseMessage\"))" | \
  jq ".[0].FunctionArn" -r)

LOG_MESSAGE_RECEIPT_LAMBDA_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"LogMessageReceipt\"))" | \
  jq ".[0].FunctionArn" -r)

SEND_TO_BICHARD_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"SendToBichard\"))" | \
  jq ".[0].FunctionArn" -r)

TEMP_STATE_MACHINE_CONFIG_FILE=./state-machine.tmp.json
cat $SCRIPTS_PATH/state-machine.json.tpl | \
  sed -e "s/\${RETRIEVE_FROM_S3_LAMBDA_ARN}/$RETRIEVE_FROM_S3_LAMBDA_ARN/g" | \
  sed -e "s/\${FORMAT_MESSAGE_LAMBDA_ARN}/$FORMAT_MESSAGE_LAMBDA_ARN/g" | \
  sed -e "s/\${PARSE_MESSAGE_LAMBDA_ARN}/$PARSE_MESSAGE_LAMBDA_ARN/g" | \
  sed -e "s/\${LOG_MESSAGE_RECEIPT_LAMBDA_ARN}/$LOG_MESSAGE_RECEIPT_LAMBDA_ARN/g" | \
  sed -e "s/\${SEND_TO_BICHARD_ARN}/$SEND_TO_BICHARD_ARN/g" \
  > $TEMP_STATE_MACHINE_CONFIG_FILE

if [[ -z $(awslocal stepfunctions list-state-machines | grep IncomingMessageHandler) ]]; then
  awslocal stepfunctions create-state-machine \
    --definition file://$TEMP_STATE_MACHINE_CONFIG_FILE \
    --name "IncomingMessageHandler" \
    --role-arn "arn:aws:iam::012345678901:role/DummyRole"
fi

rm $TEMP_STATE_MACHINE_CONFIG_FILE
