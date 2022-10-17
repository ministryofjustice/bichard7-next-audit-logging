import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"
import type { UpdateComponentsResult } from "./types"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const retryEvents = events.filter((event) => event.eventType === EventType.Retrying)
  if (retryEvents.length > 0) {
    return {
      updateExpression: "#retryCount = if_not_exists(#retryCount, :zero) + :retryCount",
      expressionAttributeNames: { "#retryCount": "retryCount" },
      updateExpressionValues: { ":retryCount": retryEvents.length, ":zero": 0 }
    }
  }

  return {}
}
