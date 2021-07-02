import MessageFetcher from "src/types/MessageFetcher"
import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"

export default class FetchByStatus implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private status: string) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchByStatus(this.status)
  }
}
