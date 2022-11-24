type DynamoDbConfig = {
  endpoint: string
  region: string
  auditLogTableName: string
  eventsTableName: string
  accessKeyId?: string
  secretAccessKey?: string
}

export default DynamoDbConfig
