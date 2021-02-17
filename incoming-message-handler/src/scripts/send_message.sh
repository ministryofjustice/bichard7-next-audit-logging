#! /bin/bash
set -ex

awslocal sqs send-message --queue-url=http://localhost:4566/000000000000/my_queue --message-body file://message.xml