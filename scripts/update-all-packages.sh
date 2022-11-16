#!/bin/bash

# set -e

packages=$(find . -name package.json | grep -v node_modules)

for p in ${packages}; do
  folder=$(dirname $p)
  echo "Updating $folder"
  pushd $folder
  npx npm-check-updates -u
  npm i
  npm audit fix
  popd
done
