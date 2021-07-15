#!/bin/bash

set -e

source "$PWD/../../environment/get-lambda-arn.sh"

# Grab all lambda ARNs
STORE_IN_S3_LAMBDA_ARN=$(get_lambda_arn "store-in-s3")
TRANSLATE_EVENT_LAMBDA_ARN=$(get_lambda_arn "translate-event")
RECORD_EVENT_LAMBDA_ARN=$(get_lambda_arn "record-event")

# Pipe the ARNs into the State Machine config
STATE_MACHINE_CONFIG_PATH=/tmp/event-handler-state-machine.json

cat "$PWD/scripts/state-machine.json.tpl" | \
  sed "s/{STORE_IN_S3_LAMBDA_ARN}/$STORE_IN_S3_LAMBDA_ARN/g" | \
  sed "s/{TRANSLATE_EVENT_LAMBDA_ARN}/$TRANSLATE_EVENT_LAMBDA_ARN/g" | \
  sed "s/{RECORD_EVENT_LAMBDA_ARN}/$RECORD_EVENT_LAMBDA_ARN/g" > "$STATE_MACHINE_CONFIG_PATH"

# Create the state machine (if it doesn't exist) using the config
STATE_MACHINE_NAME=BichardEventHandler
if [[ -z $(awslocal stepfunctions list-state-machines | grep "$STATE_MACHINE_NAME") ]]; then
  awslocal stepfunctions create-state-machine \
    --definition "file://$STATE_MACHINE_CONFIG_PATH" \
    --name "$STATE_MACHINE_NAME" \
    --role-arn "arn:aws:iam::012345678901:role/DummyRole"
fi

rm "$STATE_MACHINE_CONFIG_PATH"
