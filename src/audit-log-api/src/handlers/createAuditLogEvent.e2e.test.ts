jest.retryTimes(10)
import axios from "axios"
import { HttpStatusCode } from "shared"
import { mockAuditLog, mockAuditLogEvent } from "shared-testing"
import type { AuditLog, BichardAuditLogEvent } from "shared-types"
import { auditLogDynamoConfig } from "src/test/dynamoDbConfig"
import { TestDynamoGateway } from "../test"

describe("Creating Audit Log event", () => {
  it("should create a new audit log event for an existing audit log record", async () => {
    const gateway = new TestDynamoGateway(auditLogDynamoConfig)

    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as BichardAuditLogEvent
    expect(actualEvent.attributes?.["Attribute 1"]).toHaveProperty("valueLookup")

    actualEvent.attributes["Attribute 1"] = event.attributes["Attribute 1"]
    expect(actualEvent.eventXml).toHaveProperty("valueLookup")
    expect({ ...actualEvent, eventXml: undefined }).toEqual({ ...event, eventXml: undefined })
  })
})
