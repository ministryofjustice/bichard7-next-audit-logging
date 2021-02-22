#!/bin/bash

set -e

elapsed=0

until [ -n "$(curl --silent http://localstack_main:4566 | grep running)" ]; do
  echo "Waiting for local infrastructure to be available..."
  sleep 1

  elapsed=($elapsed+1)

  if [[ $elapsed -eq 30 ]]; then
    echo "Failed to detect infrastructure"
    exit 1
  fi
done
