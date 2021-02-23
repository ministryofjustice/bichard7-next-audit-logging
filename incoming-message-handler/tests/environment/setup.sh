#!/bin/bash

set -e

export LOCALSTACK_URL=http://localhost:4566

docker-compose -f $PWD/tests/environment/docker-compose.yml up -d

$PWD/tests/environment/infrastructure/wait.sh
$PWD/tests/environment/infrastructure/setup.sh
