function get_lambda_arn {
  local lambda_name=$1

  awslocal lambda list-functions | \
    jq ".[] | map(select(.FunctionName == \"$lambda_name\"))" | \
    jq -r ".[0].FunctionArn"
}
