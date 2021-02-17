#! /bin/bash
set -ex

SERVICES=sqs,lambda,s3 LAMBDA_REMOTE_DOCKER=false NODE_TLS_REJECT_UNAUTHORIZED=0 localstack start