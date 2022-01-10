import type AuditLogEvent from "./AuditLogEvent"

export default interface TopExceptionsReport {
  events: AuditLogEvent[]
}
