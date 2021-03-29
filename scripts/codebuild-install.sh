#!/bin/sh

set -e

# Install NodeJS and the Node Package Manager (npm)
curl -fsSL https://deb.nodesource.com/setup_15.x | bash -
apt install -y nodejs

npm i -g npm@7.7.0

echo "NodeJS version: $(node -v)"
echo "NPM version: $(npm -v)"
