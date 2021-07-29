#! /bin/bash

set -e

SCRIPTS_PATH=$PWD/scripts

source $SCRIPTS_PATH/../../environment/audit-log-api-url.sh

REGION=us-east-1
STAGE=dev

function create_lambda {
  LAMBDA_NAME=$1
  HANDLER_NAME=$2

  if ! awslocal lambda list-functions | grep -q "$LAMBDA_NAME"; then
    LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
      --function-name "$LAMBDA_NAME" \
      --code S3Bucket="__local__",S3Key="$PWD/build" \
      --handler "$HANDLER_NAME" \
      --runtime nodejs14.x \
      --role whatever \
      --timeout 15
  fi

  # Configure the lambda with environment variables
  awslocal lambda update-function-configuration \
    --function-name "$LAMBDA_NAME" \
    --environment file://"$PWD"/scripts/env-vars.json
}

function create_rest_api {
  API_NAME=$1

  if ! awslocal apigateway get-rest-apis | grep -q "$API_NAME"; then
    awslocal apigateway create-rest-api \
        --name "$API_NAME" \
        --region "$REGION"
  fi
}

function get_lambda_arn {
  LAMBDA_NAME=$1

  awslocal lambda list-functions | \
    jq ".[] | map(select(.FunctionName == \"$LAMBDA_NAME\"))" | \
    jq -r ".[0].FunctionArn"
}

function get_rest_api_id {
  API_NAME=$1

  awslocal apigateway get-rest-apis \
    --query "items[?name==\`$API_NAME\`].id" \
    --output text \
    --region $REGION
}

function get_resource_id {
    API_NAME=$1
    ENDPOINT=$2

    API_ID=$(get_rest_api_id $API_NAME)

    awslocal apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[?path=='/$ENDPOINT'].id" \
    --output text \
    --region "$REGION"
}

function create_rest_endpoint {
  API_NAME=$1
  ENDPOINT=$2
  HTTP_METHOD=$3
  LAMBDA_NAME=$4
  FULL_PATH=$5
  PARENT_RESOURCE_ID=$6

  LAMBDA_ARN=$(get_lambda_arn $LAMBDA_NAME)
  API_ID=$(get_rest_api_id $API_NAME)

  if [[ -z "$PARENT_RESOURCE_ID" ]]; then
    PARENT_RESOURCE_ID=$(awslocal apigateway get-resources \
      --rest-api-id "$API_ID" \
      --query "items[?path=='/'].id" \
      --output text \
      --region "$REGION" \
    )
  fi

  RESOURCE_ID=$(awslocal apigateway get-resources \
    --rest-api-id "$API_ID" \
    --query "items[?path=='$FULL_PATH'].id" \
    --output text \
    --region "$REGION" \
  )

  if [[ -z $RESOURCE_ID ]]; then
    RESOURCE_ID=$(awslocal apigateway create-resource \
        --region "$REGION" \
        --rest-api-id "$API_ID" \
        --parent-id "$PARENT_RESOURCE_ID" \
        --path-part "$ENDPOINT" | jq -r '.id' \
    )
  fi

  awslocal apigateway put-method \
      --region "$REGION" \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method "$HTTP_METHOD" \
      --authorization-type "NONE"

  awslocal apigateway put-integration \
      --region "$REGION" \
      --rest-api-id "$API_ID" \
      --resource-id "$RESOURCE_ID" \
      --http-method "$HTTP_METHOD" \
      --type AWS \
      --integration-http-method "$HTTP_METHOD" \
      --uri "arn:aws:apigateway:$REGION:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations"
}

function deploy_api {
  API_ID=$(get_rest_api_id $1)

  awslocal apigateway create-deployment \
      --region "$REGION" \
      --rest-api-id "$API_ID" \
      --stage-name "$STAGE"

  echo "API available at: http://localhost:4566/restapis/$API_ID/$STAGE/_user_request_/"
}

function update_env_vars_file {
  local env_path=$SCRIPTS_PATH/env-vars.json
  local api_url=$(get_audit_log_api_url localstack_main)

  if [[ -z $api_url ]]; then
    echo "Failed to retrieve the API URL"
    exit 1
  fi

  if [[ -z "$MQ_HOST" ]]; then
    MQ_HOST=mq:61613
  fi

  cat > $env_path <<- EOM
{
  "Variables": {
    "MQ_URL": "failover:(stomp://$MQ_HOST)",
    "MQ_USER": "admin",
    "MQ_PASSWORD": "admin",
    "AWS_URL": "http://localstack_main:4566",
    "AWS_REGION": "us-east-1",
    "AUDIT_LOG_EVENTS_BUCKET": "audit-log-events",
    "AUDIT_LOG_TABLE_NAME": "audit-log",
    "API_URL": "$api_url"
  }
}
EOM
}

# Create audit log api
create_rest_api "AuditLogApi"

# Update environment variables file
update_env_vars_file

# Paths
MESSAGES_PATH="/messages"
SINGLE_MESSAGE_PATH="/messages/{messageId}"
EVENTS_PATH="/messages/{messageId}/events"
RETRY_MESSAGE_PATH="/messages/{messageId}/retry"

# GET /messages
create_lambda "GetMessages" "getMessages.default"
create_rest_endpoint "AuditLogApi" "messages" "GET" "GetMessages" $MESSAGES_PATH
MESSAGES_RESOURCE_ID=$(get_resource_id "AuditLogApi" "messages")

# POST /messages
create_lambda "CreateAuditLog" "createAuditLog.default"
create_rest_endpoint "AuditLogApi" "messages" "POST" "CreateAuditLog" $MESSAGES_PATH

# GET /messages/{messageId}
create_rest_endpoint "AuditLogApi" "{messageId}" "GET" "GetMessages" $SINGLE_MESSAGE_PATH $MESSAGES_RESOURCE_ID
MESSAGES_PROXY_RESOURCE_ID=$(get_resource_id "AuditLogApi" "messages/{messageId}")

# GET /messages/{messageId}/events
create_lambda "GetEvents" "getEvents.default"
create_rest_endpoint "AuditLogApi" "events" "GET" "GetEvents" $EVENTS_PATH $MESSAGES_PROXY_RESOURCE_ID

# POST /messages/{messageId}/events
create_lambda "CreateAuditLogEvent" "createAuditLogEvent.default"
create_rest_endpoint "AuditLogApi" "events" "POST" "CreateAuditLogEvent" $EVENTS_PATH $MESSAGES_PROXY_RESOURCE_ID

# POST /messages/{messageId}/retry
create_lambda "RetryMessage" "retryMessage.default"
create_rest_endpoint "AuditLogApi" "retry" "POST" "RetryMessage" $RETRY_MESSAGE_PATH $MESSAGES_PROXY_RESOURCE_ID

deploy_api "AuditLogApi"
