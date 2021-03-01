#!/bin/bash

# When we spin up the process in the background, it
# does not detach properly, so manually stop and
# remove all AWS SAM CLI emulation containers that
# have been used to host our lambda in debug mode
echo "Performing debug cleanup..."
docker ps -a |\
  grep "amazon/aws-sam-cli-emulation-image-nodejs" |\
  cut -c -12 |\
  xargs docker stop |\
  xargs docker rm

echo "Finished!"
