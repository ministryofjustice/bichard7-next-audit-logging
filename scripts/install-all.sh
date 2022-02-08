#!/bin/sh

set -ex

projects=$(cat scripts/projects)

echo Installing root dependencies...
npm i

for p in ${projects}; do
  echo "Installing $p dependencies..."
  cd $p
  npm i
  if [ "$p" = "src/audit-log-api" ]; then
    npm run install-dynamo;
  fi
  cd -
done
