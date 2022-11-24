import type { ApiAuditLogEvent } from "src/shared/types"

export default interface TranslationResult {
  messageId: string
  event: ApiAuditLogEvent
}
