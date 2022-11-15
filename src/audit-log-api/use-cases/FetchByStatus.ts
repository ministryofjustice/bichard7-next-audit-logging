import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { FetchByStatusOptions } from "../types/queryParams"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByStatus implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private status: string,
    private readonly options: FetchByStatusOptions = {}
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

    return this.gateway.fetchByStatus(this.status, { ...this.options, lastMessage })
  }
}
