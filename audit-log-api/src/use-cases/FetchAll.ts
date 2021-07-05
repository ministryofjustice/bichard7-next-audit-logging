import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"
import MessageFetcher from "./MessageFetcher"

export default class FetchAll implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchMany()
  }
}
