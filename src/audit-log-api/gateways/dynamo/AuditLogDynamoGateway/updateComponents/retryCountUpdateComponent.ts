import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import type { UpdateComponentsResult } from "./types"

export default (_: AuditLogEvent[], events: AuditLogEvent[]): UpdateComponentsResult => {
  const retryEvents = events.filter((event) => event.eventCode === EventCode.RetryingMessage)
  if (retryEvents.length > 0) {
    return {
      updateExpression: "#retryCount = if_not_exists(#retryCount, :zero) + :retryCount",
      expressionAttributeNames: { "#retryCount": "retryCount" },
      updateExpressionValues: { ":retryCount": retryEvents.length, ":zero": 0 }
    }
  }

  return {}
}
