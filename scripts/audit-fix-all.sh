#!/bin/sh

set -ex

projects=$(cat scripts/projects)

echo Auto fixing root dependencies...
npm audit fix || true

for p in ${projects}; do
  echo "Auto fixing $p dependencies..."
  cd $p
  npm audit fix || true
  cd -
done
