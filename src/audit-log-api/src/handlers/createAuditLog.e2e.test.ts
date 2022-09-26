jest.retryTimes(10)
import axios from "axios"
import type { AuditLog } from "shared-types"
import { HttpStatusCode, TestDynamoGateway } from "shared"
import { mockAuditLog, auditLogDynamoConfig } from "shared-testing"

describe("Creating Audit Log", () => {
  it("should create a new audit log record", async () => {
    const gateway = new TestDynamoGateway(auditLogDynamoConfig)

    const auditLog = mockAuditLog()

    const result = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()
    expect(record?.messageId).toEqual(auditLog.messageId)
  })
})
