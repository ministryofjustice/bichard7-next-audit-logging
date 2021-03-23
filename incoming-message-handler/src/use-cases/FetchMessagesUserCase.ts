import { isError, PromiseResult } from "@handlers/common"
import AuditLogDynamoGateway from "src/gateways/AuditLogDynamoGateway"
import { AuditLog } from "src/entities"

export default class FetchMessagesUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  async get(): PromiseResult<AuditLog[]> {
    const result = await this.gateway.fetchMany()

    if (isError(result)) {
      return new Error("Results not found")
    }

    const messages: AuditLog[] = result.map((message: AuditLog) => {
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
