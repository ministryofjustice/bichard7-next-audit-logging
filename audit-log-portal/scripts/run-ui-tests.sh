#!/bin/bash

# Wait until application is running
APP_URL=http://localhost:3000
RESPONSE_CODE=404
RETRY=7

echo "Waiting for 'audit-log-portal' on $APP_URL"

while [ $RESPONSE_CODE != "200" ] && [ $RETRY -gt 0 ]; do
  RESPONSE_CODE=$(curl --write-out "%{http_code}\n" --silent --output /dev/null "$APP_URL")
  let RETRY--
  sleep 2
done

# Exit if it couldn't get 200 response code
if [ $RETRY -eq 0 ]; then
  echo "'audit-log-portal' is not running on $APP_URL"
  exit 1
fi

# Run Cypress UI tests
echo "Running UI tests"
npx cypress run
