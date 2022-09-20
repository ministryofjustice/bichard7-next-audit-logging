jest.retryTimes(10)
import axios from "axios"
import { HttpStatusCode, TestDynamoGateway } from "shared"
import { mockAuditLog } from "shared-testing"
import type { AuditLog, DynamoDbConfig } from "shared-types"

const dynamoConfig: DynamoDbConfig = {
  DYNAMO_URL: "http://localhost:8000",
  DYNAMO_REGION: "eu-west-2",
  TABLE_NAME: "auditLogTable",
  AWS_ACCESS_KEY_ID: "DUMMY",
  AWS_SECRET_ACCESS_KEY: "DUMMY"
}
const gateway = new TestDynamoGateway(dynamoConfig)

describe("Creating Audit Log", () => {
  beforeEach(async () => {
    await gateway.deleteAll(dynamoConfig.TABLE_NAME, "messageId")
  })

  it("should create a new audit log record", async () => {
    const auditLog = mockAuditLog()

    const result = await axios.post("http://localhost:3010/manyMessages", [auditLog])
    expect(result.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(dynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()
    expect(record?.messageId).toEqual(auditLog.messageId)
  })

  it("should create many audit log records", async () => {
    const auditLogs = new Array(10).fill(0).map(() => mockAuditLog())

    const result = await axios.post("http://localhost:3010/manyMessages", auditLogs)
    expect(result.status).toEqual(HttpStatusCode.created)

    auditLogs.forEach(async (auditLog) => {
      const record = await gateway.getOne<AuditLog>(dynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

      expect(record).not.toBeNull()
      expect(record?.messageId).toEqual(auditLog.messageId)
    })
  })

  it("should succeed when attempting to create just under the limit of audit logs", async () => {
    const auditLogs = new Array(25).fill(0).map(() => mockAuditLog())

    const result = await axios.post("http://localhost:3010/manyMessages", auditLogs, { validateStatus: (_) => true })
    expect(result.status).toEqual(HttpStatusCode.created)
    expect((await gateway.getAll(dynamoConfig.TABLE_NAME)).Items).toHaveLength(25)
  })

  it("should give an appropriate error when attempting to create too many audit logs", async () => {
    const auditLogs = new Array(100).fill(0).map(() => mockAuditLog())

    const result = await axios.post("http://localhost:3010/manyMessages", auditLogs, { validateStatus: (_) => true })
    expect(result.status).toEqual(HttpStatusCode.badRequest)

    expect((await gateway.getAll(dynamoConfig.TABLE_NAME)).Items).toHaveLength(0)
  })
})