function create_lambda {
  local lambda_name=$1
  local handler_name=$2
  local env_vars_path=$3

  if [[ -z $(awslocal lambda list-functions | grep "$lambda_name") ]]; then
    LAMBDA_REMOTE_DOCKER=false awslocal lambda create-function \
      --function-name "$lambda_name" \
      --code S3Bucket="__local__",S3Key="$PWD/build" \
      --handler "$handler_name" \
      --runtime nodejs14.x \
      --role whatever \
      --timeout 15
  fi

  # Configure the lambda with environment variables
  awslocal lambda update-function-configuration \
    --function-name "$lambda_name" \
    --environment "file://$env_vars_path"
}