#!/bin/bash

set -e

REGION=us-east-1
STAGE=dev
HOST=http://localhost:4566
API_NAME=GetMessages

# Note: We ignore this from source control so we need to generate it fresh.
# This also allows us to update the API parameter in case it has changed.
ENV_PATH=.env.local

API_URL=https://audit-log-api.dev
API_MOCKED_VAR=NEXT_PUBLIC_API_MOCKED=true
API_MOCKED_ARG=$1

if [[ -z $API_MOCKED_ARG ]] || [ $API_MOCKED_ARG != "--mock-api" ]; then
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

  API_MOCKED_VAR=
  API_URL="$HOST/restapis/$API_ID/$STAGE/_user_request_"
fi

# Note: Environment variables that are to be exposed to the browser must be
# prefixed with NEXT_PUBLIC_.
# See: https://nextjs.org/docs/basic-features/environment-variables
cat > $ENV_PATH <<- EOM
NEXT_PUBLIC_API_URL=$API_URL
$API_MOCKED_VAR
EOM
