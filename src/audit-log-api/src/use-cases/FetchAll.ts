import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

type FetchAllOptions = {
  lastMessageId?: string
  includeColumns?: string[]
  excludeColumns?: string[]
}

export default class FetchAll implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private readonly options: FetchAllOptions = {}
  ) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options.lastMessageId)

    if (isError(lastMessage)) {
      return lastMessage
    }

    return this.gateway.fetchMany({ lastMessage, ...this.options })
  }
}
