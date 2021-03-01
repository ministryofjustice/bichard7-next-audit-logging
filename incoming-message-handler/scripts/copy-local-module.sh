#!/bin/bash

function unlink_and_copy_local_modules {

  # Unlink the existing @handlers/common broken symbolic link first
  # so we can overwrite it with the properly resolved version
  unlink node_modules/@handlers/common
  
  cp -RL ../../../node_modules/@handlers/common node_modules/@handlers/common
}

# Only run the following command when we are running under the .aws-sam build directory.
# This copies the local module @handlers/common from the parent node_modules directory
# into the AWS SAM CLI build directory and properly resolves the symbolic link.
case $PWD/ in
  */.aws-sam/*) unlink_and_copy_local_modules;;
esac
