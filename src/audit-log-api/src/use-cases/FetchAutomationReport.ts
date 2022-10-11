import type { AuditLog, AuditLogDynamoGateway, PromiseResult, RangeQueryOptions } from "shared-types"
import type MessageFetcher from "./MessageFetcher"

export default class FetchAutomationReport implements MessageFetcher {
  constructor(private readonly gateway: AuditLogDynamoGateway, private readonly options: RangeQueryOptions) {}

  fetch(): PromiseResult<AuditLog[]> {
    console.log("Fetching automation report")
    return this.gateway.fetchRange(this.options)
  }
}
