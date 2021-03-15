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

# Create the lambda function
if [[ -z $(awslocal lambda list-functions | grep $LAMBDA_NAME) ]]; then
  LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
    --function-name $LAMBDA_NAME \
    --code S3Bucket="__local__",S3Key=$PWD/build \
    --handler index.sendMessage \
    --runtime nodejs12.x \
    --role whatever
fi

# Configure the lambda with environment variables
awslocal lambda update-function-configuration \
  --function-name $LAMBDA_NAME \
  --environment file://$INFRA_PATH/environment.json

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
  jq ".[] | map(select(.FunctionName == \""$LAMBDA_NAME"\"))" | \
  jq ".[0].FunctionArn" | sed -e "s/\"//g")

TEMP_STATE_MACHINE_CONFIG_FILE=/tmp/state-machine.json
cat $INFRA_PATH/state-machine.json | sed -e "s/{LAMBDA_ARN}/$ORIGINAL_LAMBDA_ARN/g" > $TEMP_STATE_MACHINE_CONFIG_FILE

awslocal stepfunctions create-state-machine \
  --definition file://$TEMP_STATE_MACHINE_CONFIG_FILE \
  --name "RunOriginalLambdaStateMachine" \
  --role-arn "arn:aws:iam::012345678901:role/DummyRole"

rm $TEMP_STATE_MACHINE_CONFIG_FILE
