import type { BichardAuditLogEvent } from "shared-types"

export default interface TranslationResult {
  messageId: string
  event: BichardAuditLogEvent
}
