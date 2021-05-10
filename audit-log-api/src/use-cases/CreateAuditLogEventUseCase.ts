import { AuditLogEvent, AuditLogDynamoGateway, isError, PromiseResult } from "shared"

const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.name === "ConditionalCheckFailedException"

export default class CreateAuditLogEventUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    const result = await this.auditLogGateway.addEvent(messageId, event)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        result.name = "notFound"
        result.message = `A message with Id ${messageId} already exists in the database`
      } else {
        result.name = "error"
      }

      return result
    }

    return undefined
  }
}
