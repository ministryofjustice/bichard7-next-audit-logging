import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockAuditLog, mockAuditLogEvent } from "src/shared/testing"
import type { AuditLog, AuditLogEvent } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"

describe("Creating Audit Log events", () => {
  const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
  const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)

  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
  })

  it("should create a single new audit log event for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/manyEvents`, [event])
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as AuditLog

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as AuditLogEvent
    expect(actualEvent).toStrictEqual({
      category: event.category,
      eventCode: event.eventCode,
      eventSource: event.eventSource,
      eventSourceQueueName: event.eventSourceQueueName,
      eventType: event.eventType,
      eventXml: event.eventXml,
      timestamp: event.timestamp,
      attributes: event.attributes
    } as AuditLogEvent)
  })

  it("should create many new audit log events for an existing audit log record", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const events = new Array(10).fill(0).map((_, index) => mockAuditLogEvent({ eventType: `Test event ${index}` }))
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/manyEvents`, events)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as AuditLog

    const { messageId, events: dynamoEvents } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(dynamoEvents).toHaveLength(10)
    const eventTypes = events.map((e) => e.eventType)
    dynamoEvents.forEach((event) => {
      expect(eventTypes).toContain(event.eventType)
    })
  })
})
