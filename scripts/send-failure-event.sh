#!/bin/bash

set -e

EVENT_NAME=$1

if [[ -z $EVENT_NAME ]]
then
    echo "ERROR: Script is expecting 1 parameter"
    exit 1
fi

MESSAGE_DATA=$(cat "events/$EVENT_NAME.xml" | base64)
PAYLOAD=$(cat <<- EOM
{
  "eventSource": "$EVENT_NAME",
  "eventSourceArn": "$EVENT_NAME",
  "messages": [
    {
      "messageID": "",
      "messageType": "FailureEvent",
      "data": "$MESSAGE_DATA"
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
