import minBy from "lodash.minby"
import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import type { UpdateComponentsResult } from "./types"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const archivalEvents = events.filter((event) => event.eventCode === EventCode.ErrorRecordArchived)
  if (archivalEvents.length > 0) {
    return {
      updateExpression: "#errorRecordArchivalDate = :errorRecordArchivalDate",
      expressionAttributeNames: { "#errorRecordArchivalDate": "errorRecordArchivalDate" },
      updateExpressionValues: {
        ":errorRecordArchivalDate": minBy(archivalEvents, (event) => event.timestamp)?.timestamp
      }
    }
  }

  return {}
}
