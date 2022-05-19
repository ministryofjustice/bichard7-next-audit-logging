import type { AuditLog, AuditLogEvent, PromiseResult } from "."

export default interface ApiClient {
  getMessage(messageId: string): PromiseResult<AuditLog>

  createAuditLog(auditLog: AuditLog): PromiseResult<void>

  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void>

  sanitiseMessage(messageId: string): PromiseResult<void>
}
