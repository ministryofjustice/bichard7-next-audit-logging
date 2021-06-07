#!/bin/bash

set -e

# Create the DynamoDb table for persisting the AuditLog entity
if [[ -z $(awslocal dynamodb list-tables | grep audit-log) ]]; then
  awslocal dynamodb create-table \
    --table-name audit-log \
    --attribute-definitions \
      AttributeName=messageId,AttributeType=S AttributeName=_,AttributeType=S AttributeName=receivedDate,AttributeType=S \
    --key-schema \
      AttributeName=messageId,KeyType=HASH \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5 \
    --global-secondary-index \
      IndexName=receivedDateIndex,KeySchema=\[\{AttributeName=_,KeyType=HASH\},\{AttributeName=receivedDate,KeyType=RANGE\}\],ProvisionedThroughput=\{ReadCapacityUnits=10,WriteCapacityUnits=5\},Projection=\{ProjectionType=ALL\}
fi
