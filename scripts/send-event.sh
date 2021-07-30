#!/bin/bash

set -e

EVENT_NAME=$1
QUEUE_NAME=$2
EVENT_DATE_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

if [[ -z $EVENT_NAME ]] || [[ -z $QUEUE_NAME ]]
then
    echo "ERROR: Script is expecting 2 parameters"
    exit 1
fi

if [[ -z $MESSAGE_ID ]]
then
    echo "ERROR: Script requires MESSAGE_ID environment variable"
    exit 1
fi

MESSAGE_DATA=$(cat "events/$EVENT_NAME.xml" | \
  sed "s#{MESSAGE_ID}#$MESSAGE_ID#g" | \
  sed "s#{EVENT_TYPE}#$EVENT_TYPE#g" | \
  sed "s#{EVENT_DATE_TIME}#$EVENT_DATE_TIME#g" | \
  base64)

PAYLOAD=$(cat <<- EOM
{
  "eventSource": "$EVENT_NAME",
  "eventSourceArn": "$EVENT_NAME",
  "messages": [
    {
      "messageID": "",
      "messageType": "FailureEvent",
      "data": "$MESSAGE_DATA",
      "destination": {
        "physicalName": "$QUEUE_NAME"
      }
    }
  ]
}
EOM
)

awslocal lambda invoke \
  --function-name "$EVENT_NAME-receiver" \
  --invocation-type Event \
  --payload "$PAYLOAD" \
  output.json
