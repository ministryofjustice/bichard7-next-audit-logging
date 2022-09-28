import type { AuditLogEvent } from "shared-types"
import type { UpdateComponentsResult } from "../../utils/updateComponentTypes"
import CalculateMessageStatusUseCase from "../CalculateMessageStatusUseCase"

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
