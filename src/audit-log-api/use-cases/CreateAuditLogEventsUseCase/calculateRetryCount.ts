import type { AuditLogEvent, DynamoAuditLog } from "src/shared/types"
import { EventCode } from "src/shared/types"

export default (events: AuditLogEvent[]): Partial<DynamoAuditLog> => {
  const retryEvents = events.filter((event) => event.eventCode === EventCode.RetryingMessage)
  if (retryEvents.length > 0) {
    return { retryCount: retryEvents.length }
  }

  return {}
}
