import { DynamoDbConfig } from "shared"

export default function createDynamoDbConfig(): DynamoDbConfig {
  return {
    DYNAMO_URL: process.env.AWS_URL,
    DYNAMO_REGION: process.env.AWS_REGION,
    AUDIT_LOG_TABLE_NAME: process.env.AUDIT_LOG_TABLE_NAME
  }
}
