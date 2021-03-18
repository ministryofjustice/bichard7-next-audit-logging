import { isError, PromiseResult } from "@handlers/common"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
import { AuditLog } from "src/entities"

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
