import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import type { ProjectionOptions } from "shared-types/build/AuditLogDynamoGateway"
import type MessageFetcher from "./MessageFetcher"

export default class FetchUnsanitised implements MessageFetcher {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private limit: number,
    private readonly options: ProjectionOptions
  ) {}

  fetch(): PromiseResult<AuditLog[]> {
    return this.gateway.fetchUnsanitised(this.limit, this.options)
  }
}
