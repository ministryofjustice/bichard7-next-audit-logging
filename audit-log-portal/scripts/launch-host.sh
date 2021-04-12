#!/bin/bash

set -e

# Make sure the local infrastructure is up and running
cd ..

environment/setup.sh

cd -

# Make sure the code is built for production
npm run build

# Deploy the local changes into the infrastructure
lambda_name=portal

if ! awslocal lambda list-functions | grep -q "$lambda_name"; then
  LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
    --function-name "$lambda_name" \
    --code S3Bucket="__local__",S3Key="$PWD" \
    --handler host.handler \
    --runtime nodejs12.x \
    --role whatever
fi

lambda_arn=$( \
  awslocal lambda list-functions | \
  jq -r '.Functions[] | select(.FunctionName == "$lambda_name") | .FunctionArn' \
)

echo "Lambda ARN: $lambda_arn"

# Note: Cannot create VPC, Subnet or Load Balancer through LocalStack.
# vpc_name=portal-host-vpc
# subnet1_name=portal-host-subnet1
# subnet2_name=portal-host-subnet2

# if awslocal ec2 describe-vpcs --filter "Name=tag:name,Values=$vpc_name"; then
#   id=$( \
#     awslocal ec2 create-vpc --cidr-block 10.0.0.0/16 | \
#     jq -r '.Vpcs[0].VpcId' \
#   )

#   awslocal ec2 create-tags \
#     --resources $id \
#     --tags "Key=name,Value=$vpc_name"
# fi

# vpc_id=$( \
#   awslocal ec2 describe-vpcs --filter "Name=tag:name,Values=$vpc_name | \
#   jq -r '.Vpcs[0].VpcId' \
# )

# function create_subnet {
#   name=$1

#   if ! awslocal ec2 describe-subnets --filter "Name=tag:name,Values=$name"; then
#     id=$( \
#       awslocal ec2 create-subnet --vpc-id $vpc_id --cidr-block 10.0.1.0/24 |
#       jq -r '.Subnet.SubnetId' \
#     )

#     awslocal ec2 create-tags \
#       --resources $id \
#       --tags "Key=name,Value=$name"
#   fi

#   awslocal ec2 describe-subnets --filter "Name=tag:name,Values=$name" | \
#     jq -r '.Subnets[0].SubnetId'
# }

# subnet1_id=$(create_subnet $subnet1_name)
# subnet2_id=$(create_subnet $subnet2_name)

# alb_name=$lambda_name-load-balancer
# alb_arn=$( \
#   awslocal elbv2 create-load-balancer --name $alb_name --subnets $subnet1 $subnet2 | \
#   jq -r '.LoadBalancers[] | select(.LoadBalancerName == "$alb_name") | .LoadBalancerArn' \
# )

# target_name=$lambda_name-target-group
# target_arn=$( \
#   awslocal elbv2 create-target-group --name $target_name --target-type lambda | \
#   jq -r '.TargetGroups[] | select(.TargetGroupName == $target_name") | .TargetGroupArn' \
# )

# awslocal elbv2 create-listener \
#   --load-balancer-arn $alb_arn \
#   --protocol HTTP \
#   --port 80 \
#   --default-actions Type=forward,TargetGroupArn=$target_arn

# aws lambda add-permission \
#   --function-name $lambda_name \
#   --statement-id load-balancer \
#   --principal elasticloadbalancing.amazonaws.com \
#   --action lambda:InvokeFunction \
#   --source-arn $target_arn

# aws elbv2 register-targets \
#   --target-group-arn $target_arn \
#   --targets Id=$lambda_arn
