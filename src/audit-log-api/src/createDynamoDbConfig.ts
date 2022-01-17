import type { DynamoDbConfig } from "shared-types"

export default function createDynamoDbConfig(): DynamoDbConfig {
  const { AWS_URL, AWS_REGION, AUDIT_LOG_TABLE_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env

  if (!AWS_URL) {
    throw Error("AWS_URL environment variable must have value.")
  }

  if (!AWS_REGION) {
    throw Error("AWS_REGION environment variable must have value.")
  }

  if (!AUDIT_LOG_TABLE_NAME) {
    throw Error("AUDIT_LOG_TABLE_NAME environment variable must have value.")
  }

  return {
    DYNAMO_URL: AWS_URL,
    DYNAMO_REGION: AWS_REGION,
    AUDIT_LOG_TABLE_NAME,
    AWS_ACCESS_KEY_ID: AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY
  }
}