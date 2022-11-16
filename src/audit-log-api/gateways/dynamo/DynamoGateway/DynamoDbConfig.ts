type DynamoDbConfig = {
  endpoint: string
  region: string
  auditLogTableName: string
  eventsTableName: string
  lookupTableName: string
  accessKeyId?: string
  secretAccessKey?: string
}

export default DynamoDbConfig
