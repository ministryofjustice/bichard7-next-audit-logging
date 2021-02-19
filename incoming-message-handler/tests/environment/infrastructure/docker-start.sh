#!/bin/bash

set -e

# Make sure we wait for localstack to be running before we run the setup commands
./wait.sh
./setup.sh
