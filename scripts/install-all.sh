#!/bin/sh

set -e

projects=$(cat scripts/projects)

echo Installing root dependencies...
npm i

for p in ${projects}; do
  echo "Installing $p dependencies..."
  cd $p
  npm i
  cd -
done
