import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { FetchUnsanitisedOptions } from "shared-types/build/AuditLogDynamoGateway"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchUnsanitised implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: FetchUnsanitisedOptions) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options.lastMessageId)
    if (isError(lastMessage)) {
      return lastMessage
    }

    return this.gateway.fetchUnsanitised({ lastMessage, ...this.options })
  }
}
