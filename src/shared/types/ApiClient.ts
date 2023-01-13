import type { ApiAuditLogEvent, InputApiAuditLog, OutputApiAuditLog, PromiseResult } from "."

export type GetMessagesOptions = {
  status?: string
  lastMessageId?: string
  limit?: number
  largeObjects?: boolean
}

export type GetMessageOptions = {
  limit?: number
  includeColumns?: string[]
  excludeColumns?: string[]
}

export default interface ApiClient {
  getMessages(options?: GetMessagesOptions): PromiseResult<OutputApiAuditLog[]>
  getMessage(messageId: string, options?: GetMessageOptions): PromiseResult<OutputApiAuditLog>
  createAuditLog(auditLog: InputApiAuditLog): PromiseResult<void>
  createEvent(messageId: string, event: ApiAuditLogEvent): PromiseResult<void>
  createUserEvent(userName: string, event: ApiAuditLogEvent): PromiseResult<void>
  retryEvent(messageId: string): PromiseResult<void>
  sanitiseMessage(messageId: string): PromiseResult<void>
  fetchUnsanitised(options?: GetMessageOptions): PromiseResult<OutputApiAuditLog[]>
}
