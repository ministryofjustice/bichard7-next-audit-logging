#!/bin/bash

set -e

# Move into a sub directory so the for loop can jump up and down through project folders
cd scripts

while IFS= read -r project; do
  echo "Running tests for $project dependencies..."
  cd ../$project
  npm run test:ci
done < "projects"

echo Finished testing!
