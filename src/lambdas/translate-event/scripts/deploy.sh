#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"

create_lambda "translate-event" "translateEvent.default" "$PWD/scripts/env-vars.json"
