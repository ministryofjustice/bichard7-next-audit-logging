import type { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared-types"
import type MessageFetcher from "./MessageFetcher"

export default class FetchById implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private messageId: string) {}

  fetch(): PromiseResult<AuditLog> {
    return this.gateway.fetchOne(this.messageId)
  }
}
