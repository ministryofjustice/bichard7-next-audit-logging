#!/bin/bash

if [[ -z "${WORKSPACE}" ]]; then
  echo "WORKSPACE environment variable is not set"
  exit 1
fi

if [[ -z "${STATUS}" ]]; then
  echo "STATUS environment variable is not set. (Error, Processing, or Complete)"
  exit 1
fi

if [[ -z "${FROM}" ]]; then
  echo "FROM environment variable is not set. (Full or partial ISO date format)"
  exit 1
fi

if [[ -z "${TO}" ]]; then
  echo "TO environment variable is not set. (Full or partial ISO date format)"
  exit 1
fi

if [[ -z "${PROJECTION}" ]]; then
  PROJECTION="messageId,#status,receivedDate"
fi

 aws dynamodb query \
    --table-name "bichard-7-${WORKSPACE}-audit-log" \
    --index-name "statusIndex" \
    --key-condition-expression '#status=:status AND #receivedDate BETWEEN :rd1 AND :rd2' \
    --expression-attribute-values "{\":status\":{\"S\":\"${STATUS}\"}, \":rd1\": {\"S\": \"${FROM}\"}, \":rd2\": {\"S\":\"${TO}\"}}" \
    --expression-attribute-names '{"#status":"status", "#receivedDate":"receivedDate"}' \
    --projection-expression "$PROJECTION"
