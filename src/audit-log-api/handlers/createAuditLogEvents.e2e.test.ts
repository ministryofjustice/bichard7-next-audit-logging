import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockApiAuditLogEvent, mockInputApiAuditLog } from "src/shared/testing"
import { ApiAuditLogEvent, DynamoAuditLog, EventCode } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
const testGateway = new TestDynamoGateway(auditLogDynamoConfig)
const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)

describe("Creating multiple Audit Log events", () => {
  beforeEach(async () => {
    await testGateway.deleteAll(auditLogDynamoConfig.auditLogTableName, "messageId")
  })

  it("should create a single new audit log event for an existing audit log record", async () => {
    const auditLog = mockInputApiAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockApiAuditLogEvent()
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, [event])
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as DynamoAuditLog

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as ApiAuditLogEvent
    expect(actualEvent).toStrictEqual({
      category: event.category,
      eventCode: event.eventCode,
      eventSource: event.eventSource,
      eventSourceQueueName: event.eventSourceQueueName,
      eventType: event.eventType,
      eventXml: event.eventXml,
      timestamp: event.timestamp,
      attributes: event.attributes
    } as ApiAuditLogEvent)
  })

  it("should create many new audit log events for an existing audit log record", async () => {
    const auditLog = mockInputApiAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const events = new Array(10).fill(0).map((_, index) => mockApiAuditLogEvent({ eventType: `Test event ${index}` }))
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, events)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as DynamoAuditLog

    const { messageId, events: dynamoEvents } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(dynamoEvents).toHaveLength(10)
    const eventTypes = events.map((e) => e.eventType)
    dynamoEvents.forEach((event) => {
      expect(eventTypes).toContain(event.eventType)
    })
  })
})

describe("Creating a single Audit Log event", () => {
  it("should create a new audit log event for an existing audit log record", async () => {
    const auditLog = mockInputApiAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockApiAuditLogEvent({ eventType: "Dummy event type" })
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as DynamoAuditLog

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as ApiAuditLogEvent

    expect(actualEvent).toEqual({
      category: event.category,
      eventCode: event.eventCode,
      eventSource: event.eventSource,
      eventSourceQueueName: event.eventSourceQueueName,
      eventType: event.eventType,
      eventXml: event.eventXml,
      timestamp: event.timestamp,
      attributes: event.attributes
    } as ApiAuditLogEvent)
  })

  it("should transform the audit log event before saving", async () => {
    const auditLog = mockInputApiAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockApiAuditLogEvent({ attributes: { user: "Test User", eventCode: "test.event" } })
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as DynamoAuditLog

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as ApiAuditLogEvent
    expect(actualEvent.user).toBe("Test User")
    expect(actualEvent.eventCode).toBe("test.event")
  })

  describe("updating the PNC status", () => {
    const getPncStatus = async (messageId: string): Promise<string | undefined> => {
      const record = (await gateway.fetchOne(messageId)) as DynamoAuditLog
      return record?.pncStatus
    }

    it("should update the status with each event", async () => {
      const auditLog = mockInputApiAuditLog()
      await axios.post("http://localhost:3010/messages", auditLog)

      let pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("Processing")

      let event = mockApiAuditLogEvent({ eventCode: EventCode.ExceptionsGenerated })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("Exceptions")

      event = mockApiAuditLogEvent({ eventCode: EventCode.ExceptionsResolved })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("ManuallyResolved")

      event = mockApiAuditLogEvent({ eventCode: EventCode.IgnoredAppeal })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("Ignored")

      event = mockApiAuditLogEvent({ eventCode: EventCode.PncUpdated })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("Updated")
    })
  })

  describe("updating the Trigger status", () => {
    const getTriggerStatus = async (messageId: string): Promise<string | undefined> => {
      const record = (await gateway.fetchOne(messageId)) as DynamoAuditLog
      return record?.triggerStatus
    }

    it("should update the status with each event", async () => {
      const auditLog = mockInputApiAuditLog()
      await axios.post("http://localhost:3010/messages", auditLog)

      let triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("NoTriggers")

      let event = mockApiAuditLogEvent({
        attributes: { "Trigger 1 Details": "TRPR0001" },
        eventCode: EventCode.TriggersGenerated
      })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("Generated")

      event = mockApiAuditLogEvent({
        attributes: { "Trigger 1 Details": "TRPR0001" },
        eventCode: EventCode.TriggersResolved
      })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("Resolved")
    })
  })
})
