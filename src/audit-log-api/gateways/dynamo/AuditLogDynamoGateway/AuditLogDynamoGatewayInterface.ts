import type {
  FetchByStatusOptions,
  FetchManyOptions,
  FetchRangeOptions,
  FetchUnsanitisedOptions,
  ProjectionOptions
} from "src/audit-log-api/types/queryParams"
import type { AuditLog, AuditLogEvent, PromiseResult } from "src/shared/types"
import type DynamoUpdate from "../DynamoGateway/DynamoUpdate"

export default interface AuditLogDynamoGateway {
  create(message: AuditLog): PromiseResult<AuditLog>
  createMany(messages: AuditLog[]): PromiseResult<AuditLog[]>
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
  fetchOne(messageId: string, options?: ProjectionOptions): PromiseResult<AuditLog | undefined>
  fetchVersion(messageId: string): PromiseResult<number | null>
  fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]>
  replaceAuditLog(message: AuditLog, version: number): PromiseResult<void>
  update(existing: AuditLog, updates: Partial<AuditLog>): PromiseResult<void>
  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void>
}
