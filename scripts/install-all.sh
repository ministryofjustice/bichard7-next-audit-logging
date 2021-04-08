#!/bin/bash

set -e

echo Installing root dependencies...
npm i

# Move into a sub directory so the for loop can jump up and down through project folders
cd scripts

while IFS= read -r project; do
  echo "Installing $project dependencies..."
  cd ../$project
  npm i
done < "projects"
