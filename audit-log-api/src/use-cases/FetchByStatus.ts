import { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared"
import MessageFetcher from "./MessageFetcher"

export default class FetchByStatus implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private status: string) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchByStatus(this.status)
  }
}
