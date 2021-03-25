import { isError, PromiseResult, AuditLogDynamoGateway, AuditLog } from "shared"

const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.message === "The conditional request failed"

export default class PersistMessageUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  async persist(message: AuditLog): PromiseResult<AuditLog> {
    const result = await this.gateway.create(message)

    if (isError(result) && isConditionalExpressionViolationError(result)) {
      return new Error(`A message with Id ${message.messageId} already exists in the database`)
    }

    return result
  }
}
