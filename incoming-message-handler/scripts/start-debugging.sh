#!/bin/bash

echo "Building the debug image..."
sam build

echo "Starting AWS SAM CLI..."
TMPVARS=/tmp/incoming-message-handler.vars

# Note: AWS SAM uses the same environment variables, but the JSON object must be named the
# same as the lambda resource defined in the SAM template YAML, but we don't want to maintain
# two files that define the same environment variables.
cat environment/infrastructure/environment.json | sed -e "s/Variables/IncomingMessageHandler/g" > $TMPVARS

sam local invoke IncomingMessageHandler \
  -d 9999 \
  --env-vars $TMPVARS \
  -e scripts/sqs-event.json \
  --docker-network bichard_audit_logging \
  -l incoming-message-handler.log \
  &

echo "Waiting for debugger to attach..."
sleep 5

rm $TMPVARS
