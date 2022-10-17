import type { AuditLog, PromiseResult } from "shared-types"
import type { AuditLogDynamoGatewayInterface, ProjectionOptions } from "../gateways/dynamo"
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
