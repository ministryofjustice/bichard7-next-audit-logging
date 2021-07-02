import MessageFetcher from "src/types/MessageFetcher"
import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"

export default class FetchById implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private messageId: string) {}

  fetch(): PromiseResult<AuditLog> {
    return this.gateway.fetchOne(this.messageId)
  }
}
