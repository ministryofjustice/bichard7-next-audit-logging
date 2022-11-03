import type { AuditLogEvent } from "shared-types"
import CalculateMessageStatusUseCase from "../CalculateMessageStatusUseCase"
import type { UpdateComponentsResult } from "./types"

export default (currentEvents: AuditLogEvent[], newEvents: AuditLogEvent[]): UpdateComponentsResult => {
  const { status, pncStatus, triggerStatus } = new CalculateMessageStatusUseCase(...currentEvents, ...newEvents).call()
  if (status) {
    return {
      expressionAttributeNames: { "#status": "status", "#pncStatus": "pncStatus", "#triggerStatus": "triggerStatus" },
      updateExpressionValues: { ":status": status, ":pncStatus": pncStatus, ":triggerStatus": triggerStatus },
      updateExpression: "#status = :status, #pncStatus = :pncStatus, #triggerStatus = :triggerStatus"
    }
  }

  return {}
}
