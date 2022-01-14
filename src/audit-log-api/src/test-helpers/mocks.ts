import { AuditLog, AuditLogEvent } from "shared-types"
import { v4 as uuid } from "uuid"

export function mockAuditLog(): AuditLog {
  const auditLog = new AuditLog(uuid(), new Date(), "XML")
  auditLog.caseId = "Case ID"
  auditLog.createdBy = "Create audit log test"
  return auditLog
}

export function mockAuditLogEvent(): AuditLogEvent {
  return new AuditLogEvent({
    category: "information",
    timestamp: new Date(),
    eventType: "Test event",
    eventSource: "Test"
  })
}
