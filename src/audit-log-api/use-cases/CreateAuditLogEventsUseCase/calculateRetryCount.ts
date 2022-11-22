import type { DynamoAuditLog, DynamoAuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"

export default (events: DynamoAuditLogEvent[]): Partial<DynamoAuditLog> => {
  const retryEvents = events.filter((event) => event.eventCode === EventCode.RetryingMessage)
  if (retryEvents.length > 0) {
    return { retryCount: retryEvents.length }
  }

  return {}
}
