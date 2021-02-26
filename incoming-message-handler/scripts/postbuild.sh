#!/bin/bash

cp package.json package-lock.json build/

mkdir -p build/scripts
cp scripts/copy-local-module.sh build/scripts/
cp -RL node_modules/ build/
