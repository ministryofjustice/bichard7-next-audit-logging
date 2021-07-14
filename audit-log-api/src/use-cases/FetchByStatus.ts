import type { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"
import { isError } from "shared"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByStatus implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private status: string,
    private lastMessageId?: string
  ) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.lastMessageId)

    if (isError(lastMessage)) {
      return lastMessage
    }

    return this.gateway.fetchByStatus(this.status, 10, lastMessage)
  }
}
