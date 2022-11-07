import axios from "axios"
import { HttpStatusCode } from "src/shared"
import { mockAuditLog, mockAuditLogEvent } from "src/shared/testing"
import type { AuditLog, BichardAuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import { auditLogDynamoConfig, TestDynamoGateway } from "../test"
const gateway = new TestDynamoGateway(auditLogDynamoConfig)

describe("Creating Audit Log event", () => {
  it("should create a new audit log event for an existing audit log record", async () => {
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
    expect({ ...actualEvent, eventXml: undefined }).toEqual({
      ...event,
      eventXml: undefined,
      _automationReport: false,
      _topExceptionsReport: false
    })
  })

  it("should transform the audit log event before saving", async () => {
    const auditLog = mockAuditLog()
    const result1 = await axios.post("http://localhost:3010/messages", auditLog)
    expect(result1.status).toEqual(HttpStatusCode.created)

    const event = mockAuditLogEvent()
    event.addAttribute("user", "Test User")
    event.addAttribute("eventCode", "test.event")
    const result2 = await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)
    expect(result2.status).toEqual(HttpStatusCode.created)

    const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", auditLog.messageId)

    expect(record).not.toBeNull()

    const { messageId, events } = record!
    expect(messageId).toEqual(auditLog.messageId)

    expect(events).toHaveLength(1)

    const actualEvent = events[0] as BichardAuditLogEvent
    expect(actualEvent.user).toBe("Test User")
    expect(actualEvent.eventCode).toBe("test.event")
  })

  describe("updating the PNC status", () => {
    const getPncStatus = async (messageId: string): Promise<string | undefined> => {
      const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", messageId)
      return record?.pncStatus
    }

    it("should update the status with each event", async () => {
      const auditLog = mockAuditLog()
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
      const record = await gateway.getOne<AuditLog>(auditLogDynamoConfig.TABLE_NAME, "messageId", messageId)
      return record?.triggerStatus
    }

    it("should update the status with each event", async () => {
      const auditLog = mockAuditLog()
      await axios.post("http://localhost:3010/messages", auditLog)

      let triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("NoTriggers")

      let event = mockAuditLogEvent({ eventCode: EventCode.TriggersGenerated })
      event.addAttribute("Trigger 1 Details", "TRPR0001")
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("Generated")

      event = mockAuditLogEvent({ eventCode: EventCode.TriggersResolved })
      event.addAttribute("Trigger Code", "TRPR0001")
      await axios.post(`http://localhost:3010/messages/${auditLog.messageId}/events`, event)

      triggerStatus = await getTriggerStatus(auditLog.messageId)
      expect(triggerStatus).toBe("Resolved")
    })
  })
})
