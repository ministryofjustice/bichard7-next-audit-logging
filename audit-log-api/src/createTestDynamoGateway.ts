import { AuditLogDynamoGateway, DynamoDbConfig } from "shared"

const config: DynamoDbConfig = {
  DYNAMO_URL: "localhost",
  DYNAMO_REGION: "us-east-1",
  AUDIT_LOG_TABLE_NAME: "audit-log"
}

const createTestDynamoGateway = (): AuditLogDynamoGateway =>
  new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)

export default createTestDynamoGateway
