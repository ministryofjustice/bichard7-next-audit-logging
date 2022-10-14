import type { AuditLog, PromiseResult } from "shared-types"
import type { ProjectionOptions } from "src/types/queryParams"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByExternalCorrelationId implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private externalCorrelationId: string,
    private readonly options?: ProjectionOptions
  ) {}

  fetch(): PromiseResult<AuditLog | null> {
    return this.gateway.fetchByExternalCorrelationId(this.externalCorrelationId, this.options)
  }
}
