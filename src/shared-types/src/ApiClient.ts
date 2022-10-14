import type { AuditLog, AuditLogEvent, PromiseResult } from "."

export type GetMessagesOptions = {
  status?: string
  lastMessageId?: string
}

export type GetMessageOptions = {
  limit?: number
  includeColumns?: string[]
  excludeColumns?: string[]
}

export default interface ApiClient {
  getMessages(options?: GetMessagesOptions): PromiseResult<AuditLog[]>
  getMessage(messageId: string, options?: GetMessageOptions): PromiseResult<AuditLog>
  createAuditLog(auditLog: AuditLog): PromiseResult<void>
  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void>
  retryEvent(messageId: string): PromiseResult<void>
  sanitiseMessage(messageId: string): PromiseResult<void>
  fetchUnsanitised(options?: GetMessageOptions): PromiseResult<AuditLog[]>
}
