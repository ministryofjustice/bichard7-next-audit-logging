import { AuditLog, PromiseResult } from "shared"

export default interface IMessageFetcher {
  fetch: () => PromiseResult<AuditLog | AuditLog[] | null>
}
