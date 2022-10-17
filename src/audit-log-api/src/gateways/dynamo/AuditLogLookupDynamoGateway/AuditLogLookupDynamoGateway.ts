import type { AuditLogLookup, PromiseResult } from "shared-types"
import type DynamoUpdate from "../DynamoGateway/DynamoUpdate"

export default interface AuditLogLookupDynamoGateway {
  create(auditLogLookup: AuditLogLookup): PromiseResult<AuditLogLookup>
  prepare(auditLogLookup: AuditLogLookup): Promise<DynamoUpdate>
  fetchById(id: string): PromiseResult<AuditLogLookup>
  deleteByMessageId(messageId: string): PromiseResult<void>
  executeTransaction(actions: DynamoUpdate[]): PromiseResult<void>
}
