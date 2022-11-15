import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
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

  async fetch(): PromiseResult<DynamoAuditLog[]> {
    let lastMessage: DynamoAuditLog | undefined

    if (this.options.lastMessageId) {
      const result = await this.gateway.fetchOne(this.options.lastMessageId)

      if (isError(result)) {
        return result
      }

      lastMessage = result
    }

    if (isError(lastMessage)) {
      return lastMessage
    }

    return this.gateway.fetchMany({ lastMessage, ...this.options })
  }
}
