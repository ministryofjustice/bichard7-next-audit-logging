#!/bin/bash

echo "Building the debug image..."
sam build

echo "Starting AWS SAM CLI..."
sam local invoke IncomingMessageHandler -d 9999 -e scripts/event.json &

echo "Waiting for debugger to attach..."
sleep 5
