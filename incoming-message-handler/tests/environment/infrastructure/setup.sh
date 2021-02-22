#! /bin/bash
set -e

if [[ -z $LOCALSTACK_URL ]]; then
  echo "Environment variable LOCALSTACK_URL must be set"
  exit 1
fi

QUEUE_NAME=incoming_message_queue
LAMBDA_NAME=IncomingMessageHandler

# Create the lambda function
LAMBDA_REMOTE_DOCKER=false awslocal --endpoint-url="$LOCALSTACK_URL" lambda create-function --function-name $LAMBDA_NAME \
    --code S3Bucket="__local__",S3Key=/code \
    --handler index.sendMessage \
    --runtime nodejs12.x \
    --role whatever

# Create the queue and a dead letter queue
awslocal --endpoint-url="$LOCALSTACK_URL" sqs create-queue --queue-name $QUEUE_NAME

awslocal --endpoint-url="$LOCALSTACK_URL" sqs create-queue --queue-name incoming_message_dead_letter_queue

awslocal --endpoint-url="$LOCALSTACK_URL" sqs set-queue-attributes --queue-url="$LOCALSTACK_URL/000000000000/$QUEUE_NAME" --attributes file://attributes.json

# Configure the lambda with environment variables
awslocal --endpoint-url="$LOCALSTACK_URL" lambda update-function-configuration \
  --function-name $LAMBDA_NAME \
  --environment file://environment.json

# Trigger the lambda when a message is received on the queue
awslocal --endpoint-url="$LOCALSTACK_URL" lambda create-event-source-mapping \
  --function-name $LAMBDA_NAME \
  --event-source-arn arn:aws:sqs:us-east-1:000000000000:$QUEUE_NAME
