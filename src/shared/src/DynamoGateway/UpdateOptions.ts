import type {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap,
  UpdateExpression
} from "aws-sdk/clients/dynamodb"
import type { KeyValuePair } from "shared-types"

export default interface UpdateOptions {
  keyName: string
  keyValue: unknown
  updateExpression: UpdateExpression
  updateExpressionValues: ExpressionAttributeValueMap | KeyValuePair<string, unknown>
  expressionAttributeNames?: ExpressionAttributeNameMap | KeyValuePair<string, string>
  currentVersion: number
}

export interface UnconditionalUpdateOptions {
  keyName: string
  keyValue: unknown
  updateExpression: UpdateExpression
  updateExpressionValues: ExpressionAttributeValueMap | KeyValuePair<string, unknown>
  expressionAttributeNames?: ExpressionAttributeNameMap | KeyValuePair<string, string>
}
