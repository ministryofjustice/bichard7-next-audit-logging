import type { AuditLog, AuditLogEvent, DynamoUpdate, PromiseResult, RangeQueryOptions } from "."

export type FetchManyOptions = {
  lastMessage?: AuditLog
  includeColumns?: string[]
  excludeColumns?: string[]
}

export default interface AuditLogDynamoGateway {
  create(message: AuditLog): PromiseResult<AuditLog>
  createMany(messages: AuditLog[]): PromiseResult<AuditLog[]>
  update(message: AuditLog): PromiseResult<AuditLog>
  updateSanitiseCheck(message: AuditLog, nextSanitiseCheck: Date): PromiseResult<void>
  fetchMany(limit: number, options: FetchManyOptions): PromiseResult<AuditLog[]>
  fetchRange(options: RangeQueryOptions): PromiseResult<AuditLog[]>
  fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null>
  fetchByHash(hash: string): PromiseResult<AuditLog | null>
  fetchByStatus(status: string, limit: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]>
  fetchUnsanitised(limit: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]>
  fetchOne(messageId: string): PromiseResult<AuditLog>
  fetchVersion(messageId: string): PromiseResult<number | null>
  fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]>
  addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void>
  prepare(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<DynamoUpdate>
  prepareEvents(messageId: string, messageVersion: number, events: AuditLogEvent[]): PromiseResult<DynamoUpdate>
  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void>
}
