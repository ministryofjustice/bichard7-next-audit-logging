import type { AuditLogEvent } from "shared"

export default interface TranslationResult {
  messageId: string
  event: AuditLogEvent
}
