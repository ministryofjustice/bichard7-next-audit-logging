/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type {
  AuditLog,
  AuditLogDynamoGateway,
  AuditLogEvent,
  DynamoUpdate,
  FetchByStatusOptions,
  FetchRangeOptions,
  PromiseResult
} from "shared-types"
import { FetchManyOptions, FetchUnsanitisedOptions, ProjectionOptions } from "shared-types/build/AuditLogDynamoGateway"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGateway {
  private messages: AuditLog[] = []

  private error?: Error

  create(_: AuditLog): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  createMany(_: AuditLog[]): PromiseResult<AuditLog[]> {
    throw new Error("Method not implemented.")
  }

  prepare(_messageId: string, _messageVersion: number, _event: AuditLogEvent): PromiseResult<DynamoUpdate> {
    throw new Error("Method not implemented")
  }

  prepareEvents(_messageId: string, _messageVersion: number, _events: AuditLogEvent[]): PromiseResult<DynamoUpdate> {
    throw new Error("Method not implemented")
  }

  update(message: AuditLog): PromiseResult<AuditLog> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(message)
  }

  fetchMany(_?: number, __: FetchManyOptions = {}): PromiseResult<AuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchRange(_: FetchRangeOptions): PromiseResult<AuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchByExternalCorrelationId(externalCorrelationId: string, _?: ProjectionOptions): PromiseResult<AuditLog | null> {
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

  fetchByStatus(_: string, __?: number, ___?: FetchByStatusOptions): PromiseResult<AuditLog[]> {
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

  addEvent(_: string, __: number, ___: AuditLogEvent): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  insertOne<T>(_: string, __: T, ___: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  fetchUnsanitised(_: number, __?: FetchUnsanitisedOptions): PromiseResult<AuditLog[]> {
    throw new Error("Method not implemented.")
  }

  updateSanitiseCheck(_: AuditLog, __: Date): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  executeTransaction(_: DynamoUpdate[]): PromiseResult<void> {
    throw new Error("Method not implemented")
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(messages?: AuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }
}
