import axios from "axios"
import { AuditLog, DynamoDbConfig } from "shared-types"
import { HttpStatusCode, TestDynamoGateway } from "shared"
import { mockAuditLog, mockAuditLogEvent } from '../test-helpers/mocks'

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: 'http://localhost:8000',
  DYNAMO_REGION: 'eu-west-2',
  AUDIT_LOG_TABLE_NAME: 'auditLogTable',
  AWS_ACCESS_KEY_ID: 'DUMMY',
  AWS_SECRET_ACCESS_KEY: 'DUMMY'
}

describe("Creating Audit Log event", () => {
  it("should create a new audit log event for an existing audit log record", async () => {
    const gateway = new TestDynamoGateway(dynamoConfig)

    const auditLog = mockAuditLog()
    const result1 = await axios.post('http://localhost:3000/messages', auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3000/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(dynamoConfig.AUDIT_LOG_TABLE_NAME, 'messageId', auditLog.messageId)

    expect(record).not.toBeNull()
    expect(record?.messageId).toEqual(auditLog.messageId)
    expect(record?.events).toEqual([event])
  })
})