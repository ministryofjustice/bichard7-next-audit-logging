#!/bin/bash

set -e

projects=$(cat scripts/projects)

echo Installing root dependencies...
npm i

# Move into a sub directory so the for loop can jump up and down through project folders
cd scripts

for p in ${PROJECTS[@]}; do
  echo "Installing $p dependencies..."
  cd ../$p
  npm i
done
