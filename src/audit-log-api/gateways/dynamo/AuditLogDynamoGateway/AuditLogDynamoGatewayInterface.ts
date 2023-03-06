import type {
  FetchByStatusOptions,
  FetchManyOptions,
  FetchOneOptions,
  FetchRangeOptions,
  FetchUnsanitisedOptions,
  ProjectionOptions
} from "src/audit-log-api/types/queryParams"
import type { DynamoAuditLog, DynamoAuditLogEvent, DynamoAuditLogUserEvent, PromiseResult } from "src/shared/types"

export default interface AuditLogDynamoGateway {
  create(message: DynamoAuditLog): PromiseResult<DynamoAuditLog>
  createMany(messages: DynamoAuditLog[]): PromiseResult<DynamoAuditLog[]>
  createManyUserEvents(events: DynamoAuditLogUserEvent[]): PromiseResult<void>
  fetchByExternalCorrelationId(
    externalCorrelationId: string,
    options?: ProjectionOptions
  ): PromiseResult<DynamoAuditLog | null>
  fetchByHash(hash: string): PromiseResult<DynamoAuditLog | null>
  fetchByStatus(status: string, options?: FetchByStatusOptions): PromiseResult<DynamoAuditLog[]>
  fetchMany(options?: FetchManyOptions): PromiseResult<DynamoAuditLog[]>
  fetchOne(messageId: string, options?: FetchOneOptions): PromiseResult<DynamoAuditLog | undefined>
  fetchRange(options: FetchRangeOptions): PromiseResult<DynamoAuditLog[]>
  fetchUnsanitised(options?: FetchUnsanitisedOptions): PromiseResult<DynamoAuditLog[]>
  fetchVersion(messageId: string): PromiseResult<number | null>
  replaceAuditLog(message: DynamoAuditLog, version: number): PromiseResult<void>
  replaceAuditLogEvents(events: DynamoAuditLogEvent[]): PromiseResult<void>
  update(
    existing: DynamoAuditLog,
    updates: Partial<DynamoAuditLog>,
    events?: DynamoAuditLogEvent[]
  ): PromiseResult<void>
  updateSanitiseCheck(message: DynamoAuditLog, nextSanitiseCheck: Date): PromiseResult<void>
}
