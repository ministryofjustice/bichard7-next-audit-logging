import minBy from "lodash.minby"
import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"
import type { UpdateComponentsResult } from "../../utils/updateComponentTypes"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const archivalEvents = events.filter((event) => event.eventType === EventType.ErrorRecordArchival)
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
