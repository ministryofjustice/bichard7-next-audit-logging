import type { AuditLog, PromiseResult } from "src/shared/types"

export default interface MessageFetcher {
  fetch: () => PromiseResult<AuditLog | AuditLog[] | null>
}
