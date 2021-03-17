import { isError, PromiseResult } from "@handlers/common"
import IncomingMessageDynamoGateway from "src/gateways/IncomingMessageDynamoGateway"
import { IncomingMessage } from "src/entities"

const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.message === "The conditional request failed"

export default class PersistMessageUseCase {
  constructor(private readonly gateway: IncomingMessageDynamoGateway) {}

  async persist(message: IncomingMessage): PromiseResult<IncomingMessage> {
    const result = await this.gateway.create(message)

    if (isError(result) && isConditionalExpressionViolationError(result)) {
      return new Error(`A message with Id ${message.messageId} already exists in the database`)
    }

    return result
  }
}
