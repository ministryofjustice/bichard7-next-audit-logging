#! /bin/bash
set -e

if [[ -z $LOCALSTACK_URL ]]; then
  echo "Environment variable LOCALSTACK_URL must be set"
  exit 1
fi

# Get the right path for Windows
case $( (uname) | tr '[:upper:]' '[:lower:]') in
  msys*|cygwin*|mingw*|nt|win*)
    CWD=$(pwd -W)
    ;;
  *)
    CWD=$PWD
    ;;
esac

INFRA_PATH=$CWD/environment/infrastructure
QUEUE_NAME=incoming_message_queue
DLQ_NAME=incoming_message_dead_letter_queue
LAMBDA_NAME=IncomingMessageHandler

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
    --environment file://$INFRA_PATH/environment.json
}

# Create the lambda function
create_lambda "IncomingMessageHandler" "index.sendMessage"
create_lambda "FormatMessage" "formatMessage.default"
create_lambda "ParseMessage" "parseMessage.default"
create_lambda "LogMessageReceipt" "logMessageReceipt.default"
create_lambda "SendToBichard" "sendToBichard.default"

# Create the DynamoDb table for persisting the IncomingMessage entity
if [[ -z $(awslocal dynamodb list-tables | grep IncomingMessage) ]]; then
  awslocal dynamodb create-table \
    --table-name IncomingMessage \
    --attribute-definitions \
      AttributeName=messageId,AttributeType=S \
    --key-schema \
      AttributeName=messageId,KeyType=HASH \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5
fi

# Dynamo tables used specifically for integration testing
if [[ -z $(awslocal dynamodb list-tables | grep DynamoTesting) ]]; then
  awslocal dynamodb create-table \
    --table-name DynamoTesting \
    --attribute-definitions \
      AttributeName=id,AttributeType=S \
    --key-schema \
      AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5
fi

awslocal s3 mb s3://incoming-messages

# Setup the Step Function state machine to trigger our Lambda
ORIGINAL_LAMBDA_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"IncomingMessageHandler\"))" | \
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
cat $INFRA_PATH/state-machine.json | \
  sed -e "s/{ORIGINAL_LAMBDA_ARN}/$ORIGINAL_LAMBDA_ARN/g" | \
  sed -e "s/{FORMAT_MESSAGE_LAMBDA_ARN}/$FORMAT_MESSAGE_LAMBDA_ARN/g" | \
  sed -e "s/{PARSE_MESSAGE_LAMBDA_ARN}/$PARSE_MESSAGE_LAMBDA_ARN/g" | \
  sed -e "s/{LOG_MESSAGE_RECEIPT_LAMBDA_ARN}/$LOG_MESSAGE_RECEIPT_LAMBDA_ARN/g" | \
  sed -e "s/{SEND_TO_BICHARD_ARN}/$SEND_TO_BICHARD_ARN/g" \
  > $TEMP_STATE_MACHINE_CONFIG_FILE

if [[ -z $(awslocal stepfunctions list-state-machines | grep IncomingMessageHandler) ]]; then
  awslocal stepfunctions create-state-machine \
    --definition file://$TEMP_STATE_MACHINE_CONFIG_FILE \
    --name "IncomingMessageHandler" \
    --role-arn "arn:aws:iam::012345678901:role/DummyRole"
fi

rm $TEMP_STATE_MACHINE_CONFIG_FILE
