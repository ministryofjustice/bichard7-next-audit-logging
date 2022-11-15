import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { ProjectionOptions } from "../types/queryParams"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByExternalCorrelationId implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private externalCorrelationId: string,
    private readonly options?: ProjectionOptions
  ) {}

  fetch(): PromiseResult<DynamoAuditLog | null> {
    return this.gateway.fetchByExternalCorrelationId(this.externalCorrelationId, this.options)
  }
}
