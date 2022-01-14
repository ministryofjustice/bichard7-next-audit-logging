import type { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared-types"
import { isError } from "shared-types"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchAll implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private lastMessageId?: string) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.lastMessageId)

    if (isError(lastMessage)) {
      return lastMessage
    }

    return this.gateway.fetchMany(10, lastMessage)
  }
}
