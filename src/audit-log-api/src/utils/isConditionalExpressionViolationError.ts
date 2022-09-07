export default function isConditionalExpressionViolationError(error: Error): boolean {
  if (error.name === "TransactionCanceledException") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reasons = (error as unknown as { cancellationReasons: any[] }).cancellationReasons ?? []

    return reasons.some((reason) => reason.Code === "ConditionalCheckFailed")
  }
  return error.name === "ConditionalCheckFailedException"
}
