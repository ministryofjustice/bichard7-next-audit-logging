import { AuditLog, AuditLogDynamoGateway, isError, PromiseResult } from "shared"

const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.name === "ConditionalCheckFailedException"

export default class CreateAuditLogUseCase {
  constructor(private readonly auditLogGateway: AuditLogDynamoGateway) {}

  async create(auditLog: AuditLog): PromiseResult<void> {
    const result = await this.auditLogGateway.create(auditLog)

    if (isError(result)) {
      if (isConditionalExpressionViolationError(result)) {
        result.name = "conflict"
        result.message = `A message with Id ${auditLog.messageId} already exists in the database`
      } else {
        result.name = "error"
      }

      return result
    }

    return undefined
  }
}
