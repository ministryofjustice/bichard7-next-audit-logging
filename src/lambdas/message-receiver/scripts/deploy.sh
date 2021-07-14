#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"

create_lambda "message-receiver" "messageReceiver.default" "$PWD/scripts/env-vars.json"
