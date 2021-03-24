#!/bin/sh

set -e

# Install NodeJS and the Node Package Manager (npm)
curl -fsSL https://deb.nodesource.com/setup_15.x | bash -
apt install -y nodejs

echo "NodeJS version: $(node -v)"
echo "NPM version: $(npm -v)"
