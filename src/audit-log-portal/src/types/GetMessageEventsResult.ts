import type AuditLogEvent from "types/AuditLogEvent"

export default interface GetMessageEventsResult {
  events: AuditLogEvent[]
}
