import { PromiseResult, AuditLog, AuditLogDynamoGateway, isError } from "shared"
import MessageFetcher from "./MessageFetcher"

export default class FetchAll implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private lastMessageId?: string) {}

  async fetch(): PromiseResult<AuditLog[]> {
    let lastMessage: AuditLog | undefined

    if (this.lastMessageId) {
      const lastMessageResult = await this.gateway.fetchOne(this.lastMessageId)

      if (isError(lastMessageResult)) {
        return lastMessageResult
      }

      lastMessage = lastMessageResult
    }

    return this.gateway.fetchMany(10, lastMessage)
  }
}
