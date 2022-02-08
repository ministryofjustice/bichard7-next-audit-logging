#!/bin/bash

set -e

SCRIPTS_PATH=$(dirname "$0")
BUCKET_NAME=$(aws lambda list-functions | jq -r ".Functions[] | select(.FunctionName | contains(\"retrieve-from-s3\")) | .Environment.Variables.INCOMING_MESSAGE_BUCKET_NAME")

RECEIVED_DATE=$(date -u +'%Y/%m/%d/%H/%M')
MESSAGE_ID="LIBRA-EXISS-$(date -u +'%s')"
S3_MESSAGE_PATH=$RECEIVED_DATE/$MESSAGE_ID.xml
ESCAPED_MESSAGE_PATH=$(echo $S3_MESSAGE_PATH | sed -e "s/\///g")

if [[ -z $MESSAGE_PATH ]]; then
  MESSAGE_PATH=$SCRIPTS_PATH/message.xml
fi

function store_file_in_s3 {
  if [ ! -f "$MESSAGE_PATH" ]; then
    echo "$MESSAGE_PATH does not exist."
    return
  fi

  TMP_MSG=./message.tmp.xml

  cat $MESSAGE_PATH | \
    sed "s/{MESSAGE_ID}/$MESSAGE_ID/g" | \
    sed "s/EXTERNAL_CORRELATION_ID/$MESSAGE_ID/g" > $TMP_MSG
  aws s3 cp $TMP_MSG s3://$BUCKET_NAME/$S3_MESSAGE_PATH

  rm $TMP_MSG
}

store_file_in_s3
