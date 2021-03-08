import DynamoDbConfig from "./DynamoDbConfig"

export default function createDynamoDbConfig(): DynamoDbConfig {
  return {
    DYNAMO_URL: process.env.DYNAMO_URL || `http://${process.env.LOCALSTACK_HOSTNAME}:4566`,
    DYNAMO_REGION: process.env.AWS_REGION || "us-east-1"
  }
}
