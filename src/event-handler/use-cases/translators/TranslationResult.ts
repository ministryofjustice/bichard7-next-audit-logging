import type { BichardAuditLogEvent } from "src/shared/types"

export default interface TranslationResult {
  messageId: string
  event: BichardAuditLogEvent
}
