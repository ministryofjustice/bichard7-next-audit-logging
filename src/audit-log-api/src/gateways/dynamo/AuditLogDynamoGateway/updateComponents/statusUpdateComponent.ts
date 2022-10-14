import type { AuditLogEvent } from "shared-types"
import CalculateMessageStatusUseCase from "../CalculateMessageStatusUseCase"
import type { UpdateComponentsResult } from "./types"

export default (currentEvents: AuditLogEvent[], newEvents: AuditLogEvent[]): UpdateComponentsResult => {
  const status = new CalculateMessageStatusUseCase(...currentEvents, ...newEvents).call()
  if (status) {
    return {
      expressionAttributeNames: { "#status": "status" },
      updateExpressionValues: { ":status": status },
      updateExpression: "#status = :status"
    }
  }

  return {}
}
