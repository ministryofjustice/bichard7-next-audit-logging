#!/bin/sh

set -e

echo "Building the Incoming Message Handler..."
cd ./incoming-message-handler
npm i
npm run build
