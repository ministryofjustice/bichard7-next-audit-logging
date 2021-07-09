#!/bin/bash

set -e

projects=$(cat scripts/projects)

for p in ${projects[@]}; do
  echo "Building $p..."
  cd $p
  npm run build --if-present
  cd -
done
