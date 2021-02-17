#! /bin/bash
set -ex

LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function --function-name myLambda \
    --code S3Bucket="__local__",S3Key=$PWD \
    --handler index.sendMessage \
    --runtime nodejs12.x \
    --role whatever

awslocal --endpoint-url=http://localhost:4566 sqs create-queue --queue-name my_queue

awslocal --endpoint-url=http://localhost:4566 sqs create-queue --queue-name my_queue_dead

awslocal sqs set-queue-attributes --queue-url http://localhost:4566/000000000000/my_queue --attributes file://attributes.json

awslocal lambda update-function-configuration --function-name myLambda --environment file://environment.json

awslocal lambda create-event-source-mapping --function-name myLambda --event-source-arn arn:aws:sqs:us-east-1:000000000000:my_queue