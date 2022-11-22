import type { DynamoAuditLog, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { FetchByStatusOptions } from "../types/queryParams"
import convertDynamoAuditLogToOutputApi from "../utils/convertDynamoAuditLogToOutputApi"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByStatus implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private status: string,
    private readonly options: FetchByStatusOptions = {}
  ) {}

  async fetch(): PromiseResult<OutputApiAuditLog[]> {
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

    const records = await this.gateway.fetchByStatus(this.status, { ...this.options, lastMessage })
    if (isError(records)) {
      return records
    }

    return records.map(convertDynamoAuditLogToOutputApi)
  }
}
