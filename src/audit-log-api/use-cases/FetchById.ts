import type { AuditLog, PromiseResult } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type { ProjectionOptions } from "../types/queryParams"
import type MessageFetcher from "./MessageFetcher"

export default class FetchById implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGatewayInterface,
    private messageId: string,
    private readonly options?: ProjectionOptions
  ) {}

  fetch(): PromiseResult<AuditLog> {
    return this.gateway.fetchOne(this.messageId, this.options)
  }
}
