import MessageFetcher from "src/types/MessageFetcher"
import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"

export default class FetchAll implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchMany()
  }
}
