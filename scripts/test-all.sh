#!/bin/sh

set -e

projects=$(cat scripts/projects)

# Move into a sub directory so the for loop can jump up and down through project folders
cd scripts

for p in ${projects}; do
  echo "Running tests for $p..."
  cd ../$p
  npm run test:ci
done
