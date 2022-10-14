import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { FetchByStatusOptions } from "src/types/queryParams"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"
import getMessageById from "./getMessageById"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByStatus implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private status: string,
    private readonly options?: FetchByStatusOptions
  ) {}

  async fetch(): PromiseResult<AuditLog[]> {
    const lastMessage = await getMessageById(this.gateway, this.options?.lastMessageId)

    if (isError(lastMessage)) {
      return lastMessage
    }

    return this.gateway.fetchByStatus(this.status, { ...this.options, lastMessage })
  }
}
