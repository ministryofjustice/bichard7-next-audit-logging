import type { AuditLogEvent } from "shared"

export default interface GetMessageEventsResult {
  events: AuditLogEvent[]
}
