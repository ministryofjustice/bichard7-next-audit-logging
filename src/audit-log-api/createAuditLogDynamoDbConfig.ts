import type { DynamoDbConfig } from "./gateways/dynamo"

export default function createAdutiLogDynamoDbConfig(): DynamoDbConfig {
  const {
    AWS_URL,
    AWS_REGION,
    AUDIT_LOG_TABLE_NAME,
    AUDIT_LOG_EVENTS_TABLE_NAME,
    DYNAMO_AWS_ACCESS_KEY_ID,
    DYNAMO_AWS_SECRET_ACCESS_KEY
  } = process.env

  if (!AWS_URL) {
    throw Error("AWS_URL environment variable must have value.")
  }

  if (!AUDIT_LOG_TABLE_NAME) {
    throw Error("AUDIT_LOG_TABLE_NAME environment variable must have value.")
  }

  if (!AUDIT_LOG_EVENTS_TABLE_NAME) {
    throw Error("AUDIT_LOG_EVENTS_TABLE_NAME environment variable must have value.")
  }

  const config: DynamoDbConfig = {
    endpoint: AWS_URL,
    region: AWS_REGION ?? "eu-west-2",
    auditLogTableName: AUDIT_LOG_TABLE_NAME,
    eventsTableName: AUDIT_LOG_EVENTS_TABLE_NAME
  }

  if (DYNAMO_AWS_ACCESS_KEY_ID) {
    config.accessKeyId = DYNAMO_AWS_ACCESS_KEY_ID
  }

  if (DYNAMO_AWS_SECRET_ACCESS_KEY) {
    config.secretAccessKey = DYNAMO_AWS_SECRET_ACCESS_KEY
  }

  return config
}
