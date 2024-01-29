import type { OutputApiAuditLog, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { ProjectionOptions } from "../types/queryParams"
import convertDynamoAuditLogToOutputApi from "../utils/convertDynamoAuditLogToOutputApi"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByHash implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private messageId: string,
    private readonly options?: ProjectionOptions
  ) {}

  async fetch(): PromiseResult<OutputApiAuditLog[]> {
    const records = await this.gateway.fetchByHash(this.messageId, this.options)
    if (isError(records)) {
      return records
    }

    return records.map(convertDynamoAuditLogToOutputApi)
  }
}
