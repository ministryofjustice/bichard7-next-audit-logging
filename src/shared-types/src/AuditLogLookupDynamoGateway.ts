import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import type { AuditLogLookup, PromiseResult } from "."

export default interface AuditLogLookupDynamoGateway {
  create(auditLogLookup: AuditLogLookup): PromiseResult<AuditLogLookup>
  prepare(auditLogLookup: AuditLogLookup): PromiseResult<DocumentClient.TransactWriteItem>
  fetchById(id: string): PromiseResult<AuditLogLookup>
  deleteByMessageId(messageId: string): PromiseResult<void>
}
