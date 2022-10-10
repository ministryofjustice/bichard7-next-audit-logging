import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import type MessageFetcher from "./MessageFetcher"

export default class FetchUnsanitised implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private limit: number) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchUnsanitised(this.limit)
  }
}
