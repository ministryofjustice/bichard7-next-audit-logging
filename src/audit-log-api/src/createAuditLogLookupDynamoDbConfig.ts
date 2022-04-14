import type { DynamoDbConfig } from "shared-types"

export default function createAuditLogLookupDynamoDbConfig(): DynamoDbConfig {
  const { AWS_URL, AWS_REGION, AUDIT_LOG_LOOKUP_TABLE_NAME, DYNAMO_AWS_ACCESS_KEY_ID, DYNAMO_AWS_SECRET_ACCESS_KEY } =
    process.env

  if (!AWS_URL) {
    throw Error("AWS_URL environment variable must have value.")
  }

  if (!AWS_REGION) {
    throw Error("AWS_REGION environment variable must have value.")
  }

  if (!AUDIT_LOG_LOOKUP_TABLE_NAME) {
    throw Error("AUDIT_LOG_LOOKUP_TABLE_NAME environment variable must have value.")
  }

  const config: DynamoDbConfig = {
    DYNAMO_URL: AWS_URL,
    DYNAMO_REGION: AWS_REGION,
    TABLE_NAME: AUDIT_LOG_LOOKUP_TABLE_NAME
  }

  if (DYNAMO_AWS_ACCESS_KEY_ID) {
    config.AWS_ACCESS_KEY_ID = DYNAMO_AWS_ACCESS_KEY_ID
  }

  if (DYNAMO_AWS_SECRET_ACCESS_KEY) {
    config.AWS_SECRET_ACCESS_KEY = DYNAMO_AWS_SECRET_ACCESS_KEY
  }
  return config
}
