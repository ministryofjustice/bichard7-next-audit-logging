#!/bin/bash

set -e

echo "Building the shared library..."
cd shared
npm i
npm run build
cd ..

echo "Building the Incoming Message Handler..."
cd incoming-message-handler
npm i
npm run build:dev
cd ..

echo "Building the Audit Log API..."
cd audit-log-api
npm i
npm run build:dev
cd ..
