export default function isConditionalExpressionViolationError(error: Error): boolean {
  return error.name === "ConditionalCheckFailedException"
}
