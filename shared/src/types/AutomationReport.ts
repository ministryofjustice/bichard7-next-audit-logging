import type AuditLogEvent from "./AuditLogEvent"

export default interface AutomationReport {
  forceOwner?: string
  events: AuditLogEvent[]
}
