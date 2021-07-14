/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type { AuditLog, AuditLogDynamoGateway, AuditLogEvent, PromiseResult } from "shared"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGateway {
  private messages: AuditLog[] = []

  private error?: Error

  create(_message: AuditLog): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  fetchMany(_limit?: number, _lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.externalCorrelationId === externalCorrelationId)

    return Promise.resolve(message ?? null)
  }

  fetchByStatus(_status: string, _limit?: number, _lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchOne(messageId: string): PromiseResult<AuditLog> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.messageId === messageId)

    if (!message) {
      return Promise.resolve(new Error("Message not found."))
    }

    return Promise.resolve(message)
  }

  fetchVersion(_messageId: string): PromiseResult<number | null> {
    throw new Error("Method not implemented.")
  }

  fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const result = this.messages.find((x) => x.messageId === messageId)?.events

    return Promise.resolve(result ?? [])
  }

  addEvent(_messageId: string, _messageVersion: number, _event: AuditLogEvent): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  insertOne<T>(_tableName: string, _record: T, _keyName: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(messages?: AuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }
}
