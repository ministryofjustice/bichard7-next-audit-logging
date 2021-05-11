#!/bin/bash

set -e

EVENT=$(base64 "$PWD/scripts/event.json")

# Since we can't use AmazonMQ as a trigger for the Lambda when using LocalStack,
# we need to send the event message as a payload when invoking the Lambda manually
awslocal lambda invoke \
  --function-name "GeneralEventHandler" \
  --invocation-type Event \
  --payload "$EVENT" \
  output.json
