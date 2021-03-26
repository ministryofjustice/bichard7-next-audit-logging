#!/bin/bash

set -e

echo "Testing the shared library..."
cd shared
npm i
npm test
cd ..

echo "Testing the Incoming Message Handler..."
cd incoming-message-handler
npm i
npm test
cd ..

echo "Testing the Audit Log API..."
cd audit-log-api
npm i
npm test
cd ..
