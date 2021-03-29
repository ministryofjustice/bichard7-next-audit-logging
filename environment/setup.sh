#!/bin/bash

set -e

export LOCALSTACK_URL=http://localhost:4566

cd environment

docker-compose -f docker-compose.yml up -d

./wait.sh
