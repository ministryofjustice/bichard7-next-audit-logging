#!/bin/bash

set -e

source "$PWD/../../environment/get-lambda-arn.sh"
source "$PWD/../../environment/create-lambda.sh"

# Grab all lambda ARNs
STORE_IN_S3_LAMBDA_ARN=$(get_lambda_arn "store-in-s3")
TRANSLATE_EVENT_LAMBDA_ARN=$(get_lambda_arn "translate-event")
RECORD_EVENT_LAMBDA_ARN=$(get_lambda_arn "record-event")

# Pipe the ARNs into the State Machine config
STATE_MACHINE_CONFIG_PATH=/tmp/event-handler-state-machine.json

cat "$PWD/scripts/state-machine.json.tpl" | \
  sed "s/\${STORE_IN_S3_LAMBDA_ARN}/$STORE_IN_S3_LAMBDA_ARN/g" | \
  sed "s/\${TRANSLATE_EVENT_LAMBDA_ARN}/$TRANSLATE_EVENT_LAMBDA_ARN/g" | \
  sed "s/\${RECORD_EVENT_LAMBDA_ARN}/$RECORD_EVENT_LAMBDA_ARN/g" > "$STATE_MACHINE_CONFIG_PATH"

# Create the state machine (if it doesn't exist) using the config
STATE_MACHINE_NAME=BichardEventHandler
if [[ -z $(awslocal stepfunctions list-state-machines | grep "$STATE_MACHINE_NAME") ]]; then
  awslocal stepfunctions create-state-machine \
    --definition "file://$STATE_MACHINE_CONFIG_PATH" \
    --name "$STATE_MACHINE_NAME" \
    --role-arn "arn:aws:iam::012345678901:role/DummyRole"
fi

rm "$STATE_MACHINE_CONFIG_PATH"

STATE_MACHINE_ARN=$( \
  awslocal stepfunctions list-state-machines | \
  jq -r ".[] | map(select(.name == \"$STATE_MACHINE_NAME\")) | .[0].stateMachineArn" \
)

echo "STATE_MACHINE_ARN=$STATE_MACHINE_ARN"

ENV_VARS_TEMPLATE_FILE="$PWD/scripts/message-receiver-env-vars.json.tpl"
function create_message_receiver {
  local format=$1
  local name=$2
  local env_vars_file="/tmp/message-receiver-$format-env-vars.json"

  cat "$ENV_VARS_TEMPLATE_FILE" | \
    sed "s/{STEP_FUNCTION_ARN}/$STATE_MACHINE_ARN/g" | \
    sed "s/{MESSAGE_FORMAT}/$format/g" > "$env_vars_file"

  create_lambda "$name-receiver" "messageReceiver.default" "$env_vars_file" "$PWD/../lambdas/message-receiver/build"
}

create_message_receiver "AuditEvent" "audit-event"
create_message_receiver "GeneralEvent" "general-event"
create_message_receiver "CourtResultInput" "court-result-input"
create_message_receiver "HearingOutcomePncUpdate" "hearing-outcome-pnc-update"
create_message_receiver "DataSetPncUpdate" "data-set-pnc-update"
create_message_receiver "PncUpdateRequest" "pnc-update-request"
