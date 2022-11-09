import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import type { UpdateComponentsResult } from "./types"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const sanitisationEvents = events.filter((event) => event.eventCode === EventCode.Sanitised)
  if (sanitisationEvents.length > 0) {
    return {
      updateExpression: "#isSanitised = :isSanitised",
      expressionAttributeNames: { "#isSanitised": "isSanitised" },
      updateExpressionValues: { ":isSanitised": 1 }
    }
  }

  return {}
}