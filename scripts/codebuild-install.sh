#!/bin/sh

set -e

# Install NodeJS and the Node Package Manager (npm)
curl -fsSL https://deb.nodesource.com/setup_15.x | bash -
apt install -y nodejs

echo "Checking NodeJS version... $(node -v)"
echo "Checking NPM version... $(npm -v)"
