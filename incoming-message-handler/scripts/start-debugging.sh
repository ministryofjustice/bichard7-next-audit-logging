#!/bin/bash

echo "Starting AWS SAM CLI..."
sam local invoke IncomingMessageHandler -d 9999 -e scripts/event.json &

sleep 5
