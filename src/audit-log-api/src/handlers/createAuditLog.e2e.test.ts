jest.retryTimes(10)
import axios from "axios"
import { HttpStatusCode } from "shared"
import { mockAuditLog } from "shared-testing"
import type { AuditLog } from "shared-types"
import { auditLogDynamoConfig } from "src/test/dynamoDbConfig"
import { TestDynamoGateway } from "../test"

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
