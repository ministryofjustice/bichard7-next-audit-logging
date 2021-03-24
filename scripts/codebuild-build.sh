#!/bin/sh

set -e

echo "Building the Incoming Message Handler..."
cd ./incoming-message-handler

echo "Step 1/2: Install packages"
npm i -f

echo "Step 2/2: Build output"
npm run build
