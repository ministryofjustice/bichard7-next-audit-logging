#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"
source "$PWD/../../../environment/audit-log-api-url.sh"

API_URL=$(get_audit_log_api_url "localstack_main")
ENV_VARS=/tmp/env-vars.json

# Process the template env-vars file with the API URL
cat "$PWD/scripts/env-vars.json.tpl" | sed "s,{API_URL},$API_URL,g" > "$ENV_VARS"

create_lambda "record-event" "recordEvent.default" "$ENV_VARS"