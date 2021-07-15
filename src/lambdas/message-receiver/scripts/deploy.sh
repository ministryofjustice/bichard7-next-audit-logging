#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"

# Create a dummy step function that we can execute in the tests
STEP_FUNCTION_NAME=DummyMessageReceiverStepFunction
if [[ -z $(awslocal stepfunctions list-state-machines | grep "$STEP_FUNCTION_NAME") ]]; then
  awslocal stepfunctions create-state-machine \
    --definition "file://$PWD/scripts/dummy-state-machine.json" \
    --name "$STEP_FUNCTION_NAME" \
    --role-arn "arn:aws:iam::012345678901:role/DummyRole"
fi

create_lambda "message-receiver" "messageReceiver.default" "$PWD/scripts/env-vars.json"
