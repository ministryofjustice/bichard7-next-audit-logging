#!/bin/bash

set -e

source "$PWD/../../../environment/create-lambda.sh"

create_lambda "store-in-s3" "storeInS3.default" "$PWD/scripts/env-vars.json"
