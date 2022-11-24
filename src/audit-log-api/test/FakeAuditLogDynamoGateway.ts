/* eslint-disable class-methods-use-this */
import type { DynamoAuditLog, DynamoAuditLogEvent, PromiseResult } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface, DynamoUpdate } from "../gateways/dynamo"
import type {
  FetchByStatusOptions,
  FetchManyOptions,
  FetchRangeOptions,
  FetchUnsanitisedOptions,
  ProjectionOptions
} from "../types/queryParams"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGatewayInterface {
  private messages: DynamoAuditLog[] = []

  private error?: Error

  create(_: DynamoAuditLog): PromiseResult<DynamoAuditLog> {
    throw new Error("Method not implemented.")
  }

  createMany(_: DynamoAuditLog[]): PromiseResult<DynamoAuditLog[]> {
    throw new Error("Method not implemented.")
  }

  executeTransaction(_: DynamoUpdate[]): PromiseResult<void> {
    throw new Error("Method not implemented")
  }

  fetchByExternalCorrelationId(
    externalCorrelationId: string,
    _?: ProjectionOptions
  ): PromiseResult<DynamoAuditLog | null> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.externalCorrelationId === externalCorrelationId)

    return Promise.resolve(message ?? null)
  }

  fetchByHash(hash: string): PromiseResult<DynamoAuditLog | null> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.messageHash === hash)

    return Promise.resolve(message ?? null)
  }

  fetchByStatus(_: string, __?: FetchByStatusOptions): PromiseResult<DynamoAuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchMany(_: FetchManyOptions = {}): PromiseResult<DynamoAuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchOne(messageId: string): PromiseResult<DynamoAuditLog> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.messageId === messageId)

    if (!message) {
      return Promise.resolve(new Error("Message not found."))
    }

    return Promise.resolve(message)
  }

  fetchRange(_: FetchRangeOptions): PromiseResult<DynamoAuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve(this.messages)
  }

  fetchUnsanitised(_?: FetchUnsanitisedOptions): PromiseResult<DynamoAuditLog[]> {
    throw new Error("Method not implemented.")
  }

  fetchVersion(_: string): PromiseResult<number | null> {
    throw new Error("Method not implemented.")
  }

  insertOne<T>(_: string, __: T, ___: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  replaceAuditLog(_: DynamoAuditLog, __: number): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  replaceAuditLogEvents(_: DynamoAuditLogEvent[]): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  reset(messages?: DynamoAuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  update(_: DynamoAuditLog, __: Partial<DynamoAuditLog>): PromiseResult<void> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve()
  }

  updateSanitiseCheck(_: DynamoAuditLog, __: Date): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }
}
