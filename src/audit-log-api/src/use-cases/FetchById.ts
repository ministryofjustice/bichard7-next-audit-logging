import type { AuditLog, PromiseResult } from "shared-types"
import type { AuditLogDynamoGateway, ProjectionOptions } from "../gateways/dynamo"
import type MessageFetcher from "./MessageFetcher"

export default class FetchById implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private messageId: string,
    private readonly options?: ProjectionOptions
  ) {}

  fetch(): PromiseResult<AuditLog> {
    return this.gateway.fetchOne(this.messageId, this.options)
  }
}
