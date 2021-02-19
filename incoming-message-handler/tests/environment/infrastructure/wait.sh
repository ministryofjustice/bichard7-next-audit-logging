#!/bin/bash

set -e

until [ -n "$(curl --silent http://localstack_main:4566 | grep running)" ]; do
  echo "Waiting for local infrastructure to be available..."
  sleep 1
done
