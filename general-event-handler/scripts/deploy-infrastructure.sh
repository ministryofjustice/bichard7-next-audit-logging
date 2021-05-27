#!/bin/bash

SCRIPTS_PATH="$PWD/scripts"

source "$SCRIPTS_PATH/../../environment/audit-log-api-url.sh"
set -e

function create_lambda {
  local lambda_name=$1
  local handler_name=$2

  if ! awslocal lambda list-functions | grep -q "$lambda_name"; then
    LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
      --function-name "$lambda_name" \
      --code S3Bucket="__local__",S3Key="$PWD/build" \
      --handler "$handler_name" \
      --runtime nodejs14.x \
      --role whatever \
      --timeout 15
  fi

  # Configure the lambda with environment variables
  awslocal lambda update-function-configuration \
    --function-name "$lambda_name" \
    --environment file://"$PWD"/scripts/env-vars.json
}

function update_env_vars_file {
  local env_path="$SCRIPTS_PATH/env-vars.json"
  local api_url=$(get_audit_log_api_url localstack_main)

  if [[ -z $api_url ]]; then
    echo "Failed to retrieve the API URL"
    exit 1
  fi

  cat > "$env_path" <<- EOM
{
  "Variables": {
    "AWS_URL": "http://localstack_main:4566",
    "AWS_REGION": "us-east-1",
    "API_URL": "$api_url"
  }
}
EOM
}

# Run API
cd "$SCRIPTS_PATH/../../audit-log-api"
npm run start
cd "$SCRIPTS_PATH/.."

# Update environment variables file
update_env_vars_file

create_lambda "GeneralEventHandler" "generalEventHandler.default"
