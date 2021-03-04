#! /bin/bash
set -e

if [[ -z $LOCALSTACK_URL ]]; then
  echo "Environment variable LOCALSTACK_URL must be set"
  exit 1
fi

# Get the right path for Windows
case $( (uname) | tr '[:upper:]' '[:lower:]') in
  msys*|cygwin*|mingw*|nt|win*)
    CWD=$(pwd -W)
    ;;
  *)
    CWD=$PWD
    ;;
esac

INFRA_PATH=$CWD/tests/environment/infrastructure
QUEUE_NAME=incoming_message_queue
DLQ_NAME=incoming_message_dead_letter_queue
LAMBDA_NAME=IncomingMessageHandler

# Create the lambda function
if [[ -z $(awslocal lambda list-functions | grep $LAMBDA_NAME) ]]; then
  LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
    --function-name $LAMBDA_NAME \
    --code S3Bucket="__local__",S3Key=$PWD/build \
    --handler index.sendMessage \
    --runtime nodejs12.x \
    --role whatever
fi

# Create the queue and a dead letter queue
if [[ -z $(awslocal sqs list-queues | grep $QUEUE_NAME) ]]; then
  awslocal sqs create-queue --queue-name $QUEUE_NAME
fi

if [[ -z $(awslocal sqs list-queues | grep $DLQ_NAME) ]]; then
  awslocal sqs create-queue --queue-name $DLQ_NAME
fi

awslocal sqs set-queue-attributes \
  --queue-url="$LOCALSTACK_URL/000000000000/$QUEUE_NAME" \
  --attributes file://$INFRA_PATH/attributes.json

# Configure the lambda with environment variables
awslocal lambda update-function-configuration \
  --function-name $LAMBDA_NAME \
  --environment file://$INFRA_PATH/environment.json

# Trigger the lambda when a message is received on the queue
awslocal lambda create-event-source-mapping \
  --function-name $LAMBDA_NAME \
  --event-source-arn arn:aws:sqs:us-east-1:000000000000:$QUEUE_NAME

# Create the DynamoDb tables
#  - IncomingMessage (PK = MessageId)
#  - IncomingMessageCompKey (PK = ReceivedDate.Day, SK = MessageId)
if [[ -z $(awslocal dynamodb list-tables | grep IncomingMessage | grep -v CompKey) ]]; then
  awslocal dynamodb create-table \
    --table-name IncomingMessage \
    --attribute-definitions \
      AttributeName=MessageId,AttributeType=S \
      AttributeName=CaseNumber,AttributeType=N \
    --key-schema \
      AttributeName=MessageId,KeyType=HASH \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5 \
    --global-secondary-indexes \
      IndexName=CaseNumberIndex,KeySchema=["{AttributeName=CaseNumber,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=10,WriteCapacityUnits=5}"
fi

if [[ -z $(awslocal dynamodb list-tables | grep IncomingMessageCompKey) ]]; then
  awslocal dynamodb create-table \
    --table-name IncomingMessageCompKey \
    --attribute-definitions \
      AttributeName=ReceivedDate,AttributeType=S \
      AttributeName=MessageId,AttributeType=S \
    --key-schema \
      AttributeName=ReceivedDate,KeyType=HASH \
      AttributeName=MessageId,KeyType=RANGE \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5 \
    --global-secondary-indexes \
      IndexName=MessageIdIndex,KeySchema=["{AttributeName=MessageId,KeyType=HASH}"],Projection="{ProjectionType=ALL}",ProvisionedThroughput="{ReadCapacityUnits=10,WriteCapacityUnits=5}"
fi

# Dynamo tables used specifically for integration testing
if [[ -z $(awslocal dynamodb list-tables | grep DynamoTesting) ]]; then
  awslocal dynamodb create-table \
    --table-name DynamoTesting \
    --attribute-definitions \
      AttributeName=Id,AttributeType=S \
    --key-schema \
      AttributeName=Id,KeyType=HASH \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5
fi
