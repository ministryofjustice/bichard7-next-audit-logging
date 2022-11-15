import type { DynamoAuditLog, PromiseResult } from "src/shared/types"

export default interface MessageFetcher {
  fetch: () => PromiseResult<DynamoAuditLog | DynamoAuditLog[] | null | undefined>
}
