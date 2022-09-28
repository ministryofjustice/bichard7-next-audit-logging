import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"
import type { UpdateComponentsResult } from "../../utils/updateComponentTypes"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const sanitisationEvents = events.filter((event) => event.eventType === EventType.SanitisedMessage)
  if (sanitisationEvents.length > 0) {
    return {
      updateExpression: "#isSanitised = :isSanitised",
      expressionAttributeNames: { "#isSanitised": "isSanitised" },
      updateExpressionValues: { ":isSanitised": 1 }
    }
  }

  return {}
}
