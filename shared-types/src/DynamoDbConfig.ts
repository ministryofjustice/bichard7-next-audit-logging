type DynamoDbConfig = {
  DYNAMO_URL: string
  DYNAMO_REGION: string
  AUDIT_LOG_TABLE_NAME: string
  AWS_ACCESS_KEY_ID?: string
  AWS_SECRET_ACCESS_KEY?: string
}

export default DynamoDbConfig
