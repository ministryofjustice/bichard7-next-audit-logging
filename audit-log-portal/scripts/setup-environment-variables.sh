#!/bin/bash

set -e

REGION=us-east-1
STAGE=dev
HOST=http://localhost:4566
API_NAME=AuditLogApi

# Note: We ignore this from source control so we need to generate it fresh.
# This also allows us to update the API parameter in case it has changed.
ENV_PATH=.env.local

# Grab the current url for the API
API_ID=$(awslocal apigateway get-rest-apis \
  --query "items[?name==\`$API_NAME\`].id" \
  --output text \
  --region $REGION \
)

if [[ -z $API_ID ]]; then
  echo "Failed to retrieve the API Id"
  exit 1
fi

# Note: Environment variables that are to be exposed to the browser must be
# prefixed with NEXT_PUBLIC_.
# See: https://nextjs.org/docs/basic-features/environment-variables
cat > $ENV_PATH <<- EOM
NEXT_PUBLIC_API_URL=$HOST/restapis/$API_ID/$STAGE/_user_request_
EOM
