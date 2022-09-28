import type { AuditLogLookup, DynamoUpdate, PromiseResult } from "."

export default interface AuditLogLookupDynamoGateway {
  create(auditLogLookup: AuditLogLookup): PromiseResult<AuditLogLookup>
  prepare(auditLogLookup: AuditLogLookup): Promise<DynamoUpdate>
  fetchById(id: string): PromiseResult<AuditLogLookup>
  deleteByMessageId(messageId: string): PromiseResult<void>
  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void>
}
