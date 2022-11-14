import type { AuditLogEventOptions, EventCategory } from "src/shared/types"
import { AuditLog, AuditLogEvent } from "src/shared/types"
import { v4 as uuid } from "uuid"

export function mockAuditLog(overrides: Partial<AuditLog> = {}): AuditLog {
  const logDate = overrides.receivedDate ? new Date(overrides.receivedDate) : new Date()
  const auditLog = new AuditLog(uuid(), logDate, uuid())
  auditLog.caseId = "Case ID"
  auditLog.createdBy = "Create audit log test"
  auditLog.stepExecutionId = uuid()
  auditLog.externalId = uuid()
  auditLog.s3Path = "2022/01/18/09/01/message.xml"
  auditLog.isSanitised = 0
  return { ...auditLog, ...overrides }
}

export function mockAuditLogEvent(overrides: Partial<AuditLogEventOptions> = {}): AuditLogEvent {
  const defaults: AuditLogEventOptions = {
    category: "information" as EventCategory,
    timestamp: new Date(),
    eventCode: "dummy.event.code",
    eventType: "Test event",
    eventSource: "Test",
    eventSourceQueueName: "Test event source queue name",
    eventXml: "Test event xml".repeat(500),
    attributes: {
      "Attribute 1": "Attribute 1 data".repeat(500),
      "Attribute 2": "Attribute 2 data"
    }
  }

  return new AuditLogEvent({ ...defaults, ...overrides })
}
