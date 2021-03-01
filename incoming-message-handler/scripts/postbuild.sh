#!/bin/bash

cp package.json package-lock.json build/

mkdir -p build/scripts
cp scripts/copy-local-module.sh build/scripts/

# Only install production dependencies (ignore development libraries)
cp package.json build/
cd build; npm i --production; cd ..

# Replace the @handlers/common broken sym link with the actual folder
unlink build/node_modules/@handlers/common
cp -RL node_modules/@handlers/common/ build/node_modules/@handlers/common/
