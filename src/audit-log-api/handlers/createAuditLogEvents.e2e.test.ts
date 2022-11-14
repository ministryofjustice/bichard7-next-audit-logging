jest.retryTimes(10)
import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockAuditLog, mockAuditLogEvent } from "src/shared/testing"
import type { AuditLog, AuditLogEvent } from "src/shared/types"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"

describe("Creating Audit Log events", () => {
  const gateway = new TestDynamoGateway(auditLogDynamoConfig)

  beforeEach(async () => {
    await gateway.deleteAll(auditLogDynamoConfig.TABLE_NAME, "messageId")
  })

  it("should create a single new audit log event for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/manyEvents`, [event])
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as AuditLogEvent
    expect(actualEvent.attributes?.["Attribute 1"]).toHaveProperty("valueLookup")

    actualEvent.attributes["Attribute 1"] = event.attributes["Attribute 1"]
    expect(actualEvent.eventXml).toHaveProperty("valueLookup")
    expect({ ...actualEvent, eventXml: undefined }).toEqual({
      ...event,
      _automationReport: false,
      _topExceptionsReport: false,
      eventXml: undefined
    })
  })

  it("should create many new audit log events for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const events = new Array(10).fill(0).map(() => mockAuditLogEvent())
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/manyEvents`, events)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()

    const { messageId, events: dynamoEvents } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(dynamoEvents).toHaveLength(10)
    dynamoEvents.forEach((event) => {
      const actualEvent = event as AuditLogEvent
      expect(actualEvent.attributes?.["Attribute 1"]).toHaveProperty("valueLookup")

      actualEvent.attributes["Attribute 1"] = event.attributes["Attribute 1"]
      expect(actualEvent.eventXml).toHaveProperty("valueLookup")
      expect({ ...actualEvent, eventXml: undefined }).toEqual({
        ...event,
        _automationReport: false,
        _topExceptionsReport: false,
        eventXml: undefined
      })
    })
  })
})
