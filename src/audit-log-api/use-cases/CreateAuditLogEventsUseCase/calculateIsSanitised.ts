import type { AuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { EventCode } from "src/shared/types"

export default (events: AuditLogEvent[]): Partial<DynamoAuditLog> => {
  const sanitisationEvents = events.filter((event) => event.eventCode === EventCode.Sanitised)
  if (sanitisationEvents.length > 0) {
    return { isSanitised: 1 }
  }

  return {}
}
