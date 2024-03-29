#!/bin/bash

set -e

if [[ -z "${WORKSPACE}" ]];
then
  echo "WORKSPACE environment variable is missing"
  exit 1
fi

if [[ -z "${NUMBER_OF_MESSAGES}" ]];
then
  echo "NUMBER_OF_MESSAGES environment variable is missing"
  exit 1
fi

FUNCTION_NAME=$(aws lambda list-functions --query "Functions[?contains(FunctionName, 'transfer-messages') && contains(FunctionName, '-${WORKSPACE}-')].FunctionName" --output text)
PAYLOAD=$(cat <<- EOF
{
  "numberOfObjectsToTransfer": "${NUMBER_OF_MESSAGES}"
}
EOF
)

aws lambda invoke \
  --function-name "${FUNCTION_NAME}" \
  --invocation-type RequestResponse \
  --payload "${PAYLOAD}" \
  /dev/stdout 2>/dev/null | jq
