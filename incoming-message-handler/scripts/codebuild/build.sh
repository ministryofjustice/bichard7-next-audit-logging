#!/bin/sh

set -e

echo "Installing Node packages..."
npm i

echo "Running production build..."
npm run build
