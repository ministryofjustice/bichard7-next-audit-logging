#!/bin/sh

set -e

echo "Building the Shared library..."
cd ./shared
npm i
npm run build
cd ..

echo "Building the Incoming Message Handler..."
cd ./incoming-message-handler
npm i
npm run build
