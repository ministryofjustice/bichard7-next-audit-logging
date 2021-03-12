#!/bin/bash

set -e

# Get the right path for Windows
case $( (uname) | tr '[:upper:]' '[:lower:]') in
  msys*|cygwin*|mingw*|nt|win*)
    CWD=$(pwd -W)
    ;;
  *)
    CWD=$PWD
    ;;
esac


LAMBDA_NAME=IncomingMessageHandler
BUCKET_NAME=incoming-messages
MESSAGE_PATH=$CWD/scripts/message.xml
RECEIVED_DATE=$(date +'%Y/%m/%d/%H/%M')
MESSAGE_ID=$(uuidgen)

function store_file_in_s3 {
  awslocal s3 cp $MESSAGE_PATH s3://$BUCKET_NAME/$RECEIVED_DATE/$MESSAGE_ID.xml
}

function trigger_state_machine {
  # TODO: Read s3-putobject-event.json and substitute variables to bucket and object
  BUCKET_ARN=arn:aws:s3:::$BUCKET_NAME

  ORIGINAL_LAMBDA_ARN=$( \
    awslocal lambda list-functions | \
    jq ".[] | map(select(.FunctionName == \""$LAMBDA_NAME"\"))" | \
    jq ".[0].FunctionArn" | sed -e "s/\"//g")

  TMP_PATH=/tmp/event.json
  cat $CWD/scripts/s3-putobject-event.json | \
    sed -e "s/{BUCKET_ARN}/$BUCKET_ARN/g" | \
    sed -e "s/{LAMBDA_ARN}/$ORIGINAL_LAMBDA_ARN/g" > $TMP_PATH

  STATE_MACHINE_ARN=$(awslocal stepfunctions list-state-machines | \
    jq ".stateMachines[].stateMachineArn" | \
    sed -e "s/\"//g")

  awslocal stepfunctions start-execution \
    --state-machine $STATE_MACHINE_ARN \
    --name "TriggerLambdaForMessage$MESSAGE_ID" \
    --input file://$TMP_PATH

  rm $TMP_PATH
}

store_file_in_s3
trigger_state_machine
