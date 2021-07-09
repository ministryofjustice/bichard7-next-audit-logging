import { PromiseResult, AuditLog, AuditLogDynamoGateway, isError } from "shared"
import MessageFetcher from "./MessageFetcher"

export default class FetchByStatus implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private status: string,
    private lastMessageId?: string
  ) {}

  async fetch(): PromiseResult<AuditLog[]> {
    let lastMessage: AuditLog | undefined

    if (this.lastMessageId) {
      const lastMessageResult = await this.gateway.fetchOne(this.lastMessageId)

      if (isError(lastMessageResult)) {
        return lastMessageResult
      }

      lastMessage = lastMessageResult
    }

    return this.gateway.fetchByStatus(this.status, 10, lastMessage)
  }
}
