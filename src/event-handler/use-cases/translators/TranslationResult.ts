import type { AuditLogEvent } from "src/shared/types"

export default interface TranslationResult {
  messageId: string
  event: AuditLogEvent
}
