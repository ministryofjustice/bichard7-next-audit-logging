#!/bin/bash

set -e

# Create the DynamoDb table for persisting the AuditLog entity
if [[ -z $(awslocal dynamodb list-tables | grep audit-log) ]]; then
  awslocal dynamodb create-table \
    --table-name audit-log \
    --attribute-definitions \
      AttributeName=messageId,AttributeType=S \
    --key-schema \
      AttributeName=messageId,KeyType=HASH \
    --provisioned-throughput \
      ReadCapacityUnits=10,WriteCapacityUnits=5
fi
