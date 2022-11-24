import type { OutputApiAuditLog, PromiseResult } from "src/shared/types"

export default interface MessageFetcher {
  fetch: () => PromiseResult<OutputApiAuditLog | OutputApiAuditLog[] | null | undefined>
}
