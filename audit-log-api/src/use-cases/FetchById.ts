import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"
import MessageFetcher from "./MessageFetcher"

export default class FetchById implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private messageId: string) {}

  fetch(): PromiseResult<AuditLog> {
    return this.gateway.fetchOne(this.messageId)
  }
}
