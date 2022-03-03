import type { PromiseResult, AuditLog, AuditLogDynamoGateway } from "shared-types"
import type MessageFetcher from "./MessageFetcher"

export default class FetchByHash implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private hash: string) {}

  fetch(): PromiseResult<AuditLog | null> {
    return this.gateway.fetchByHash(this.hash)
  }
}
