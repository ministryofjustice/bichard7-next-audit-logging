import { isError, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { ProjectionOptions } from "../types/queryParams"
import convertDynamoAuditLogToOutputApi from "../utils/convertDynamoAuditLogToOutputApi"
import type MessageFetcher from "./MessageFetcher"

export default class FetchById implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private messageId: string,
    private readonly options?: ProjectionOptions
  ) {}

  async fetch(): PromiseResult<OutputApiAuditLog | undefined> {
    const record = await this.gateway.fetchOne(this.messageId, this.options)
    if (isError(record) || typeof record === "undefined") {
      return record
    }

    return convertDynamoAuditLogToOutputApi(record)
  }
}
