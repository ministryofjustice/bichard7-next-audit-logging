import type {
  FetchByStatusOptions,
  FetchManyOptions,
  FetchRangeOptions,
  FetchUnsanitisedOptions,
  ProjectionOptions
} from "src/audit-log-api/types/queryParams"
import type { DynamoAuditLog, DynamoAuditLogEvent, PromiseResult } from "src/shared/types"
import type DynamoUpdate from "../DynamoGateway/DynamoUpdate"

export default interface AuditLogDynamoGateway {
  create(message: DynamoAuditLog): PromiseResult<DynamoAuditLog>
  createMany(messages: DynamoAuditLog[]): PromiseResult<DynamoAuditLog[]>
  updateSanitiseCheck(message: DynamoAuditLog, nextSanitiseCheck: Date): PromiseResult<void>
  fetchMany(options?: FetchManyOptions): PromiseResult<DynamoAuditLog[]>
  fetchRange(options: FetchRangeOptions): PromiseResult<DynamoAuditLog[]>
  fetchByExternalCorrelationId(
    externalCorrelationId: string,
    options?: ProjectionOptions
  ): PromiseResult<DynamoAuditLog | null>
  fetchByHash(hash: string): PromiseResult<DynamoAuditLog | null>
  fetchByStatus(status: string, options?: FetchByStatusOptions): PromiseResult<DynamoAuditLog[]>
  fetchUnsanitised(options?: FetchUnsanitisedOptions): PromiseResult<DynamoAuditLog[]>
  fetchOne(messageId: string, options?: ProjectionOptions): PromiseResult<DynamoAuditLog | undefined>
  fetchVersion(messageId: string): PromiseResult<number | null>
  fetchEvents(messageId: string): PromiseResult<DynamoAuditLogEvent[]>
  replaceAuditLog(message: DynamoAuditLog, version: number): PromiseResult<void>
  update(
    existing: DynamoAuditLog,
    updates: Partial<DynamoAuditLog>,
    events?: DynamoAuditLogEvent[]
  ): PromiseResult<void>
  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void>
}
