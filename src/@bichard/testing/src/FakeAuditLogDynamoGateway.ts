/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type { AuditLog, AuditLogDynamoGateway, AuditLogEvent, PromiseResult } from "shared"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGateway {
  private messages: AuditLog[] = []

  private error?: Error

  create(_: AuditLog): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  fetchMany(limit?: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
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

  // @ts-ignore
  fetchByStatus(status: string, limit?: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
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

  fetchVersion(_: string): PromiseResult<number | null> {
    throw new Error("Method not implemented.")
  }

  fetchEvents(messageId: string): PromiseResult<AuditLogEvent[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const result = this.messages.find((x) => x.messageId === messageId)?.events

    return Promise.resolve(result ?? [])
  }

  // @ts-ignore
  addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  insertOne<T>(tableName: string, record: T, keyName: string): PromiseResult<void> {
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
