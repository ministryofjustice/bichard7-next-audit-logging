import { AuditLog, PromiseResult } from "shared"

export default interface MessageFetcher {
  fetch: () => PromiseResult<AuditLog | AuditLog[] | null>
}
