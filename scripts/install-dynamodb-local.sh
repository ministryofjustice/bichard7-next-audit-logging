#!/bin/bash

if [ ! -d ./.dynamodb ]; then
  curl https://s3.eu-central-1.amazonaws.com/dynamodb-local-frankfurt/dynamodb_local_latest.tar.gz --output dynamodb.tar.gz
  mkdir -p ./.dynamodb
  tar -xf dynamodb.tar.gz -C ./.dynamodb
  rm dynamodb.tar.gz
fi
