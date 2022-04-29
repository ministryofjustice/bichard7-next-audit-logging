import type { EventCategory } from "shared-types"
import { AuditLog, BichardAuditLogEvent } from "shared-types"
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

export function mockAuditLogEvent(
  category?: EventCategory,
  eventType?: string,
  date?: Date,
  eventSourceArn?: string,
  eventSourceQueueName?: string,
  eventXml?: string
): BichardAuditLogEvent {
  const event = new BichardAuditLogEvent({
    category: category ?? "information",
    timestamp: date ?? new Date(),
    eventType: eventType ?? "Test event",
    eventSource: "Test",
    eventSourceArn: eventSourceArn ?? "Test event source ARN",
    eventSourceQueueName: eventSourceQueueName ?? "Test event source queue name",
    eventXml: eventXml ?? "Test event xml".repeat(500)
  })

  event.addAttribute("Attribute 1", "Attribute 1 data".repeat(500))
  event.addAttribute("Attribute 2", "Attribute 2 data")

  return event
}
