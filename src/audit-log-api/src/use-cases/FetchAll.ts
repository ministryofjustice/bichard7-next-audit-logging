import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

type FetchAllOptions = {
  lastMessageId?: string
  includeColumns?: string[]
  excludeColumns?: string[]
}

export default class FetchAll implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: FetchAllOptions = {}) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options.lastMessageId)

    if (isError(lastMessage)) {
      return lastMessage
    }

    const { includeColumns, excludeColumns } = this.options

    return this.gateway.fetchMany(10, { lastMessage, includeColumns, excludeColumns })
  }
}
