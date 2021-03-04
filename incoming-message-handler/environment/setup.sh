#!/bin/bash

set -e

export LOCALSTACK_URL=http://localhost:4566

docker-compose -f $PWD/environment/docker-compose.yml up -d

$PWD/environment/infrastructure/wait.sh
$PWD/environment/infrastructure/setup.sh
