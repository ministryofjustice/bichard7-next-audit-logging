import type { AuditLogLookup, PromiseResult } from "."

export default interface AuditLogLookupDynamoGateway {
  create(auditLogLookup: AuditLogLookup): PromiseResult<AuditLogLookup>
  fetchById(id: string): PromiseResult<AuditLogLookup>
}
