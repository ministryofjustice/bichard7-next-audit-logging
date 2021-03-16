#!/bin/bash
echo "Removing old build files..."
rm -rf $PWD/.aws-sam/build/IncomingMessageHandler/build

echo "Creating build folder..."
mkdir -p $PWD/.aws-sam/build/IncomingMessageHandler/build

echo "Copy the debug image..."
cp -RL $PWD/build  $PWD/.aws-sam/build/IncomingMessageHandler
echo "Debug image copied..."
