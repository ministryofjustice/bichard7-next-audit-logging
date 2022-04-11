import type { EventCategory } from "shared-types"
import { AuditLog, AuditLogEvent } from "shared-types"
import { v4 as uuid } from "uuid"

export function mockAuditLog(date?: Date): AuditLog {
  const logDate = date || new Date()
  const auditLog = new AuditLog(uuid(), logDate, uuid())
  auditLog.caseId = "Case ID"
  auditLog.createdBy = "Create audit log test"
  auditLog.stepExecutionId = uuid()
  auditLog.externalId = uuid()
  auditLog.s3Path = "2022/01/18/09/01/message.xml"
  return auditLog
}

export function mockAuditLogEvent(category?: EventCategory, eventType?: string, date?: Date): AuditLogEvent {
  const event = new AuditLogEvent({
    category: category ?? "information",
    timestamp: date ?? new Date(),
    eventType: eventType ?? "Test event",
    eventSource: "Test"
  })

  event.addAttribute("Attribute 1", "Attribute 1 data".repeat(500))
  event.addAttribute("Attribute 2", "Attribute 2 data")

  return event
}
