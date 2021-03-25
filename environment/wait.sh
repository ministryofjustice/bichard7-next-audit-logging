#!/bin/bash

set -e

if [[ -z $LOCALSTACK_URL ]]; then
  echo "Environment variable LOCALSTACK_URL must be set"
  exit 1
fi

elapsed=0

until [ -n "$(curl --silent $LOCALSTACK_URL | grep running)" ]; do
  echo "Waiting for local infrastructure to be available..."
  sleep 1

  elapsed=$[elapsed+1]

  if [[ $elapsed -eq 30 ]]; then
    echo "Failed to detect infrastructure"
    exit 1
  fi
done
