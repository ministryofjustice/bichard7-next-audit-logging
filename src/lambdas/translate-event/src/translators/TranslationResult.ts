import type { BichardAuditLogEvent } from "shared"

export default interface TranslationResult {
  messageId: string
  event: BichardAuditLogEvent
}
