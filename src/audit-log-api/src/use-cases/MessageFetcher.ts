import type { AuditLog, PromiseResult } from "shared-types"

export default interface MessageFetcher {
  fetch: () => PromiseResult<AuditLog | AuditLog[] | null>
}
