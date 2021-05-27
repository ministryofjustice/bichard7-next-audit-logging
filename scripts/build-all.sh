#!/bin/bash

set -e

projects=$(cat scripts/projects)

# Move into a sub directory so the for loop can jump up and down through project folders
cd scripts

for p in ${projects[@]}; do
  echo "Building $p..."
  cd ../$p
  npm run build --if-present
done
