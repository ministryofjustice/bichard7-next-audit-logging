#!/bin/bash

function get_audit_log_api_url {
  REGION=us-east-1
  STAGE=dev
  API_NAME=AuditLogApi
  HOST_NAME=$1

  if [[ -z $HOST_NAME ]]; then
    HOST_NAME=localhost
  fi

  HOST=http://$HOST_NAME:4566

  # Grab the current url for the API
  API_ID=$(awslocal apigateway get-rest-apis \
    --query "items[?name==\`$API_NAME\`].id" \
    --output text \
    --region $REGION \
  )

  if [[ -z $API_ID ]]; then
    return
  fi

  echo "$HOST/restapis/$API_ID/$STAGE/_user_request_"
}
