import type { AuditLog, AuditLogEvent, PromiseResult } from "shared-types"
import type DynamoUpdate from "../DynamoGateway/DynamoUpdate"

export type PaginationOptions = {
  limit?: number
  lastMessage?: AuditLog
  lastMessageId?: string
}

export type ProjectionOptions = {
  includeColumns?: string[]
  excludeColumns?: string[]
}

export type RangeQueryOptions = {
  start: Date
  end: Date
}

export type FetchManyOptions = PaginationOptions & ProjectionOptions
export type FetchUnsanitisedOptions = PaginationOptions & ProjectionOptions
export type FetchByStatusOptions = PaginationOptions & ProjectionOptions
export type FetchRangeOptions = PaginationOptions & ProjectionOptions & RangeQueryOptions
export type FetchReportOptions = PaginationOptions & RangeQueryOptions

export default interface AuditLogDynamoGateway {
  create(message: AuditLog): PromiseResult<AuditLog>
  createMany(messages: AuditLog[]): PromiseResult<AuditLog[]>
  update(message: AuditLog): PromiseResult<AuditLog>
  updateSanitiseCheck(message: AuditLog, nextSanitiseCheck: Date): PromiseResult<void>
  fetchMany(options?: FetchManyOptions): PromiseResult<AuditLog[]>
  fetchRange(options: FetchRangeOptions): PromiseResult<AuditLog[]>
  fetchByExternalCorrelationId(
    externalCorrelationId: string,
    options?: ProjectionOptions
  ): PromiseResult<AuditLog | null>
  fetchByHash(hash: string): PromiseResult<AuditLog | null>
  fetchByStatus(status: string, options?: FetchByStatusOptions): PromiseResult<AuditLog[]>
  fetchUnsanitised(options?: FetchUnsanitisedOptions): PromiseResult<AuditLog[]>
  fetchOne(messageId: string, options?: ProjectionOptions): PromiseResult<AuditLog>
  fetchVersion(messageId: string): PromiseResult<number | null>
  fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]>
  addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void>
  prepare(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<DynamoUpdate>
  prepareEvents(messageId: string, messageVersion: number, events: AuditLogEvent[]): PromiseResult<DynamoUpdate>
  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void>
}
