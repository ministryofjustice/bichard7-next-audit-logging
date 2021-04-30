#!/bin/bash

source $(dirname "$0")/../../environment/audit-log-api-url.sh
set -e

API_URL=$(get_audit_log_api_url)

if [[ -z $API_URL ]]; then
  echo "Failed to retrieve the API URL"
  exit 1
fi

# Note: We ignore this from source control so we need to generate it fresh.
# This also allows us to update the API parameter in case it has changed.
ENV_PATH=.env.local

# Note: Environment variables that are to be exposed to the browser must be
# prefixed with NEXT_PUBLIC_.
# See: https://nextjs.org/docs/basic-features/environment-variables
cat > $ENV_PATH <<- EOM
NEXT_PUBLIC_API_URL=$API_URL
EOM
