import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockInputApiAuditLog } from "src/shared/testing"
import type { DynamoAuditLog } from "src/shared/types"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"

describe("Creating Audit Log", () => {
  it("should create a new audit log record", async () => {
    const gateway = new TestDynamoGateway(auditLogDynamoConfig)

    const auditLog = mockInputApiAuditLog()

    const result = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<DynamoAuditLog>(
      auditLogDynamoConfig.auditLogTableName,
      "messageId",
      auditLog.messageId
    )

    expect(record).not.toBeNull()
    expect(record?.messageId).toEqual(auditLog.messageId)
  })
})
