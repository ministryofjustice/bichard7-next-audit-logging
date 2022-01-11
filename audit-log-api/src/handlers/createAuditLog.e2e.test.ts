import axios from "axios"
import { AuditLog, DynamoDbConfig } from "shared-types"
import { HttpStatusCode, TestDynamoGateway } from "shared"
import { mockAuditLog } from '../test-helpers/mocks'

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: 'http://localhost:8000',
  DYNAMO_REGION: 'eu-west-2',
  AUDIT_LOG_TABLE_NAME: 'auditLogTable',
  AWS_ACCESS_KEY_ID: 'DUMMY',
  AWS_SECRET_ACCESS_KEY: 'DUMMY'
}

describe("Creating Audit Log", () => {
  it("should create a new audit log record", async () => {
    const gateway = new TestDynamoGateway(dynamoConfig)

    const auditLog = mockAuditLog()

    const result = await axios.post('http://localhost:3000/messages', auditLog)
    expect(result.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(dynamoConfig.AUDIT_LOG_TABLE_NAME, 'messageId', auditLog.messageId)

    expect(record).not.toBeNull()
    expect((record as any).messageId).toEqual(auditLog.messageId)
  })
})