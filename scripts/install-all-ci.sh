#!/bin/sh

set -ex

projects=$(cat scripts/projects)

echo Installing root dependencies...
npm ci

for p in ${projects}; do
  echo "Installing $p dependencies..."
  cd $p
  npm ci
  cd -
done
