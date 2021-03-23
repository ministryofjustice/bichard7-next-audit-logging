import { isError, PromiseResult } from "@handlers/common"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
import { Message } from "src/entities"

export default class FetchMessagesUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  async get(): PromiseResult<Message[]> {
    const result = await this.gateway.fetchMany()

    if (isError(result)) {
      return new Error("Results not found")
    }

    const messages: Message[] = result.map((message: Message) => {
      const { messageId, caseId, receivedDate } = message
      return {
        messageId,
        caseId,
        receivedDate
      }
    })

    return messages
  }
}
