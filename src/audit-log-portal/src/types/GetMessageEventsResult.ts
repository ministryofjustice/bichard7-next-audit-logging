import type { AuditLogEvent } from "shared-types"

export default interface GetMessageEventsResult {
  events: AuditLogEvent[]
}
