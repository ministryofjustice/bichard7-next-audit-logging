import { isError, OutputApiAuditLog, PromiseResult } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { ProjectionOptions } from "../types/queryParams"
import convertDynamoAuditLogToOutputApi from "../utils/convertDynamoAuditLogToOutputApi"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByExternalCorrelationId implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private externalCorrelationId: string,
    private readonly options?: ProjectionOptions
  ) {}

  async fetch(): PromiseResult<OutputApiAuditLog | null> {
    const record = await this.gateway.fetchByExternalCorrelationId(this.externalCorrelationId, this.options)
    if (isError(record) || record === null) {
      return record
    }

    return convertDynamoAuditLogToOutputApi(record)
  }
}
