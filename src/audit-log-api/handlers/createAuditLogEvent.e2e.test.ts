import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockAuditLogEvent, mockInputApiAuditLog } from "src/shared/testing"
import type { AuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { EventCode } from "src/shared/types"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { auditLogDynamoConfig } from "../test"
const gateway = new AuditLogDynamoGateway(auditLogDynamoConfig)

describe("Creating Audit Log event", () => {
  it("should create a new audit log event for an existing audit log record", async () => {
    const auditLog = mockInputApiAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent({ eventType: "Dummy event type" })
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as DynamoAuditLog

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as AuditLogEvent

    expect(actualEvent).toEqual({
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

  it("should transform the audit log event before saving", async () => {
    const auditLog = mockInputApiAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    event.addAttribute("user", "Test User")
    event.addAttribute("eventCode", "test.event")
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = (await gateway.fetchOne(auditLog.messageId)) as DynamoAuditLog

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as AuditLogEvent
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

      let event = mockAuditLogEvent({ eventCode: EventCode.ExceptionsGenerated })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("Exceptions")

      event = mockAuditLogEvent({ eventCode: EventCode.ExceptionsResolved })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("ManuallyResolved")

      event = mockAuditLogEvent({ eventCode: EventCode.IgnoredAppeal })
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      pncStatus = await getPncStatus(auditLog.messageId)
      expect(pncStatus).toBe("Ignored")

      event = mockAuditLogEvent({ eventCode: EventCode.PncUpdated })
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

      let event = mockAuditLogEvent({ eventCode: EventCode.TriggersGenerated })
      event.addAttribute("Trigger 1 Details", "TRPR0001")
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("Generated")

      event = mockAuditLogEvent({ eventCode: EventCode.TriggersResolved })
      event.addAttribute("Trigger 1 Details", "TRPR0001")
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("Resolved")
    })
  })
})
