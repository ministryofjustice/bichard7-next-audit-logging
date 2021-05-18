#!/bin/sh

# Install awslocal
pip3 install awscli-local

# Configure aws
aws configure set aws_access_key_id test
aws configure set aws_secret_access_key test
aws configure set default.region us-east-1

