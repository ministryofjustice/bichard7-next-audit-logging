#!/bin/bash

set -e

projects=$(cat scripts/projects)

for p in ${projects[@]}; do
  echo "Running tests for $p..."
  cd $p
  npm run test --if-present
  cd -
done
