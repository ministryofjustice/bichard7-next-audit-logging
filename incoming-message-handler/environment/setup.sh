#! /bin/bash

set -e

if [[ -z $LOCALSTACK_URL ]]; then
  echo "Environment variable LOCALSTACK_URL must be set"
  exit 1
fi

INFRA_PATH=$PWD/environment/infrastructure

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
    --environment file://$INFRA_PATH/env-vars.json
}

# Create the lambda function
create_lambda "RetrieveFromS3" "retrieveFromS3.default"
create_lambda "FormatMessage" "formatMessage.default"
create_lambda "ParseMessage" "parseMessage.default"
create_lambda "LogMessageReceipt" "logMessageReceipt.default"
create_lambda "SendToBichard" "sendToBichard.default"

# Create the DynamoDb table for persisting the AuditLog entity
if [[ -z $(awslocal dynamodb list-tables | grep AuditLog) ]]; then
  awslocal dynamodb create-table \
    --table-name AuditLog \
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
cat $INFRA_PATH/state-machine.json | \
  sed -e "s/{RETRIEVE_FROM_S3_LAMBDA_ARN}/$RETRIEVE_FROM_S3_LAMBDA_ARN/g" | \
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

function create_rest_api {
  API_NAME=$1

  REGION=us-east-1
  STAGE=dev

  if [[ -z $(awslocal apigateway get-rest-apis | grep $API_NAME) ]]; then
    awslocal apigateway create-rest-api \
        --name ${API_NAME} \
        --region ${REGION} \

    API_ID=$(awslocal apigateway get-rest-apis --query "items[?name==\`${API_NAME}\`].id" --output text --region ${REGION})

    PARENT_RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/`].id' --output text --region ${REGION})

    awslocal apigateway create-resource \
        --region ${REGION} \
        --rest-api-id ${API_ID} \
        --parent-id ${PARENT_RESOURCE_ID} \
        --path-part "{events}"

    RESOURCE_ID=$(awslocal apigateway get-resources --rest-api-id ${API_ID} --query 'items[?path==`/{events}`].id' --output text --region ${REGION})

    awslocal apigateway put-method \
        --region ${REGION} \
        --rest-api-id ${API_ID} \
        --resource-id ${RESOURCE_ID} \
        --http-method GET \
        --request-parameters "method.request.path.events=true" \
        --authorization-type "NONE" \

    awslocal apigateway put-integration \
        --region ${REGION} \
        --rest-api-id ${API_ID} \
        --resource-id ${RESOURCE_ID} \
        --http-method GET \
        --type AWS_PROXY \
        --integration-http-method POST \
        --uri arn:aws:apigateway:${REGION}:lambda:path/2015-03-31/functions/${GET_MESSAGE_API_ARN}/invocations \
        --passthrough-behavior WHEN_NO_MATCH \

    awslocal apigateway create-deployment \
        --region ${REGION} \
        --rest-api-id ${API_ID} \
        --stage-name ${STAGE} \

  fi

  API_ID=$(awslocal apigateway get-rest-apis --query "items[?name==\`${API_NAME}\`].id" --output text --region ${REGION})
  
  ENDPOINT=http://localhost:4566/restapis/${API_ID}/${STAGE}/_user_request_/messages

  echo "API available at: ${ENDPOINT}"

}
create_rest_api "GetMessages"
