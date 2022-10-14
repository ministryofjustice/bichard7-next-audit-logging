import type { AuditLogEvent, KeyValuePair } from "shared-types"

type UpdateComponentsResult = {
  updateExpressionValues?: KeyValuePair<string, unknown>
  expressionAttributeNames?: KeyValuePair<string, string>
  updateExpression?: string
}

type UpdateComponent = (currentEvents: AuditLogEvent[], newEvents: AuditLogEvent[]) => UpdateComponentsResult

export type { UpdateComponentsResult, UpdateComponent }
