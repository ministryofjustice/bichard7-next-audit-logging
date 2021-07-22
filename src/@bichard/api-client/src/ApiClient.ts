import type { AuditLogEvent, PromiseResult } from "shared"

export default interface ApiClient {
  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void>
}
