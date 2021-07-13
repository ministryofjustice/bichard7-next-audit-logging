/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type { AuditLog, AuditLogDynamoGateway, AuditLogEvent, PromiseResult } from "shared"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGateway {
  create(_message: AuditLog): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  fetchMany(_limit?: number, _lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    throw new Error("Method not implemented.")
  }

  fetchByExternalCorrelationId(_externalCorrelationId: string): PromiseResult<AuditLog | null> {
    throw new Error("Method not implemented.")
  }

  fetchByStatus(_status: string, _limit?: number, _lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    throw new Error("Method not implemented.")
  }

  fetchOne(_messageId: string): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  fetchVersion(_messageId: string): PromiseResult<number | null> {
    throw new Error("Method not implemented.")
  }

  fetchEvents(_messageId: string): PromiseResult<AuditLogEvent[]> {
    throw new Error("Method not implemented.")
  }

  addEvent(_messageId: string, _messageVersion: number, _event: AuditLogEvent): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  insertOne<T>(_tableName: string, _record: T, _keyName: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }
}
