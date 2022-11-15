import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { FetchUnsanitisedOptions } from "../types/queryParams"
import type MessageFetcher from "./MessageFetcher"

export default class FetchUnsanitised implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private readonly options: FetchUnsanitisedOptions
  ) {}

  async fetch(): PromiseResult<DynamoAuditLog[]> {
    let lastMessage: DynamoAuditLog | undefined

    if (this.options.lastMessageId) {
      const result = await this.gateway.fetchOne(this.options.lastMessageId, {
        includeColumns: ["isSanitised", "nextSanitiseCheck"]
      })

      if (isError(result)) {
        return result
      }

      lastMessage = result
    }

    return this.gateway.fetchUnsanitised({ lastMessage, ...this.options })
  }
}
