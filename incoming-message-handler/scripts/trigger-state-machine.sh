#!/bin/bash

set -e

LAMBDA_NAME=IncomingMessageHandler
BUCKET_NAME=incoming-messages
MESSAGE_PATH=$PWD/scripts/message.xml
RECEIVED_DATE=$(date -u +'%Y/%m/%d/%H/%M')
MESSAGE_ID="LIBRA-EXISS-$(date -u +'%s')"
S3_MESSAGE_PATH=$RECEIVED_DATE/$MESSAGE_ID.xml
ESCAPED_MESSAGE_PATH=$(echo $S3_MESSAGE_PATH | sed -e "s/\///g")

function store_file_in_s3 {
  TMP_MSG=./message.tmp.xml
  
  cat $MESSAGE_PATH | sed "s/{MESSAGE_ID}/$MESSAGE_ID/g" > $TMP_MSG
  awslocal s3 cp $TMP_MSG s3://$BUCKET_NAME/$S3_MESSAGE_PATH

  rm $TMP_MSG
}

function trigger_state_machine {
  # TODO: Read s3-putobject-event.json and substitute variables to bucket and object
  ORIGINAL_LAMBDA_ARN=$( \
    awslocal lambda list-functions | \
    jq ".[] | map(select(.FunctionName == \""$LAMBDA_NAME"\"))" | \
    jq ".[0].FunctionArn" | sed -e "s/\"//g")

  TMP_PATH=./event.tmp.json
  cat $PWD/scripts/s3-putobject-event.json | \
    sed 's,{BUCKET_NAME},'"$BUCKET_NAME"',g' | \
    sed 's,{OBJECT_KEY},'"$S3_MESSAGE_PATH"',g' > $TMP_PATH

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
