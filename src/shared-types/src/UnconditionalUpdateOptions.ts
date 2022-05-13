import type {
  ExpressionAttributeNameMap,
  ExpressionAttributeValueMap,
  UpdateExpression
} from "aws-sdk/clients/dynamodb"
import type KeyValuePair from "./KeyValuePair"

export default interface UnconditionalUpdateOptions {
  keyName: string
  keyValue: unknown
  updateExpression: UpdateExpression
  updateExpressionValues: ExpressionAttributeValueMap | KeyValuePair<string, unknown>
  expressionAttributeNames?: ExpressionAttributeNameMap | KeyValuePair<string, string>
}
