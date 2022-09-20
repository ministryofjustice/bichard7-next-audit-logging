import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import type { AuditLog, AuditLogEvent, PromiseResult } from "."

export default interface AuditLogDynamoGateway {
  create(message: AuditLog): PromiseResult<AuditLog>
  createMany(messages: AuditLog[]): PromiseResult<AuditLog[]>
  update(message: AuditLog): PromiseResult<AuditLog>
  updateSanitiseCheck(message: AuditLog, nextSanitiseCheck: Date): PromiseResult<void>
  fetchMany(limit: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]>
  fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null>
  fetchByHash(hash: string): PromiseResult<AuditLog | null>
  fetchByStatus(status: string, limit: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]>
  fetchUnsanitised(limit: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]>
  fetchOne(messageId: string): PromiseResult<AuditLog>
  fetchVersion(messageId: string): PromiseResult<number | null>
  fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]>
  addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void>
  prepare(
    messageId: string,
    messageVersion: number,
    event: AuditLogEvent
  ): PromiseResult<DocumentClient.TransactWriteItem>
  executeTransaction(actions: DocumentClient.TransactWriteItem[]): PromiseResult<void>
}
