#! /bin/bash

set -e

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
    --environment file://$PWD/scripts/env-vars.json
}

function create_rest_api {
  API_NAME=$1
  LAMBDA_ARN=$2

  REGION=us-east-1
  STAGE=dev

  if [[ -z $(awslocal apigateway get-rest-apis | grep $API_NAME) ]]; then
    awslocal apigateway create-rest-api \
        --name $API_NAME \
        --region $REGION
  fi

  API_ID=$(awslocal apigateway get-rest-apis \
    --query "items[?name==\`$API_NAME\`].id" \
    --output text \
    --region $REGION \
  )

  PARENT_RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/`].id' \
    --output text \
    --region $REGION \
  )

  # Create the REST endpoint
  RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[?path==`/messages`].id' \
    --output text \
    --region $REGION \
  )

  if [[ -z $RESOURCE_ID ]]; then
    RESOURCE_ID=$(awslocal apigateway create-resource \
        --region $REGION \
        --rest-api-id $API_ID \
        --parent-id $PARENT_RESOURCE_ID \
        --path-part "messages" | jq -r '.id' \
    )
  fi

  awslocal apigateway put-method \
      --region $REGION \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method GET \
      --authorization-type "NONE"

  awslocal apigateway put-integration \
      --region $REGION \
      --rest-api-id $API_ID \
      --resource-id $RESOURCE_ID \
      --http-method GET \
      --type AWS \
      --integration-http-method GET \
      --uri arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations

  awslocal apigateway create-deployment \
      --region $REGION \
      --rest-api-id $API_ID \
      --stage-name $STAGE

  API_ID=$(awslocal apigateway get-rest-apis \
    --query "items[?name==\`$API_NAME\`].id" \
    --output text \
    --region $REGION \
  )

  echo "API available at: http://localhost:4566/restapis/$API_ID/$STAGE/_user_request_/"
}

create_lambda "GetMessages" "getMessages.default"

GET_MESSAGE_API_ARN=$( \
  awslocal lambda list-functions | \
  jq ".[] | map(select(.FunctionName == \"GetMessages\"))" | \
  jq ".[0].FunctionArn" -r)

create_rest_api "AuditLogApi" $GET_MESSAGE_API_ARN
