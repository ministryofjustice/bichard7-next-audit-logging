import minBy from "lodash.minby"
import type { DynamoAuditLog, DynamoAuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"

export default (events: DynamoAuditLogEvent[]): Partial<DynamoAuditLog> => {
  const archivalEvents = events.filter((event) => event.eventCode === EventCode.ErrorRecordArchived)
  if (archivalEvents.length > 0) {
    return {
      errorRecordArchivalDate: minBy(archivalEvents, (event) => event.timestamp)?.timestamp
    }
  }

  return {}
}
