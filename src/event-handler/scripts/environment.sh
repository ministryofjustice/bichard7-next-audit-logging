#!/bin/bash

set -e

if [[ "$SKIP_ENV" == "true" ]]; then
  echo "Skipping environment setup"
  exit 0
fi

# Spin up the base infrastructure
cd ../../environment
./setup.sh
cd -

# Deploy all lambdas
cd ../lambdas/store-in-s3
npm run setup:env
cd -

cd ../lambdas/translate-event
npm run setup:env
cd -

cd ../lambdas/record-event
npm run setup:env
cd -
