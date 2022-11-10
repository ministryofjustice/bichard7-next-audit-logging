#!/bin/bash

FILES=$(find ./event-logs -name '*.json')

for FILE in $FILES
do
  cat $FILE | jq -r ".messageData" | base64 --decode > $FILE.xml
done
