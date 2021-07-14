#!/bin/bash

set -e

cd ../../../environment
./setup.sh
cd -
cd ../../../audit-log-api
scripts/deploy-infrastructure.sh
cd -
