// @ts-ignore
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type { DocumentClient } from "aws-sdk/clients/dynamodb"
import type {
  AuditLog,
  AuditLogDynamoGateway,
  AuditLogEvent,
  PromiseResult,
  UnconditionalUpdateOptions
} from "shared-types"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGateway {
  private messages: AuditLog[] = []

  private error?: Error

  create(_: AuditLog): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  update(message: AuditLog): PromiseResult<AuditLog> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(message)
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

  fetchByHash(hash: string): PromiseResult<AuditLog | null> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.messageHash === hash)

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

    const events = this.messages.find((x) => x.messageId === messageId)?.events || []

    const sortedEvents = events.sort((eventA, eventB) => (eventA.timestamp > eventB.timestamp ? -1 : 1))

    return Promise.resolve(sortedEvents)
  }

  // @ts-ignore
  addEvent(messageId: string, messageVersion: number, event: AuditLogEvent): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  insertOne<T>(tableName: string, record: T, keyName: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  fetchUnsanitised(limit: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  updateEntryUnconditionally(
    // @ts-ignore
    tableName: string,
    // @ts-ignore
    options: UnconditionalUpdateOptions
  ): PromiseResult<DocumentClient.UpdateItemOutput> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  updateSanitiseCheck(messageId: string, nextSanitiseCheck: Date): PromiseResult<void> {
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
