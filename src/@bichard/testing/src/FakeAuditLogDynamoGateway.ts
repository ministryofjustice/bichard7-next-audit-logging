/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
import type { AuditLog, AuditLogDynamoGateway, AuditLogEvent, PromiseResult } from "shared"

export default class FakeAuditLogDynamoGateway implements AuditLogDynamoGateway {
  private messages: AuditLog[] = []

  private error?: Error

  private getMessagesOrderedByReceivedDate(): AuditLog[] {
    return this.messages.sort((messageA, messageB) => (messageA.receivedDate > messageB.receivedDate ? -1 : 1))
  }

  create(_message: AuditLog): PromiseResult<AuditLog> {
    throw new Error("Method not implemented.")
  }

  fetchMany(limit?: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const orderedMessages = this.getMessagesOrderedByReceivedDate()
    const fetchLimit = limit || 10
    if (lastMessage) {
      const filterFromIndex = orderedMessages.findIndex((x) => x.messageId === lastMessage.messageId) + 1
      return Promise.resolve(orderedMessages.slice(filterFromIndex, filterFromIndex + fetchLimit))
    }

    return Promise.resolve(orderedMessages.slice(0, fetchLimit))
  }

  fetchByExternalCorrelationId(externalCorrelationId: string): PromiseResult<AuditLog | null> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.find((x) => x.externalCorrelationId === externalCorrelationId)

    if (!message) {
      return Promise.resolve(new Error("Message not found."))
    }

    return Promise.resolve(message)
  }

  fetchByStatus(status: string, limit?: number, lastMessage?: AuditLog): PromiseResult<AuditLog[]> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const filteredMessages = this.getMessagesOrderedByReceivedDate().filter((x) => x.status === status)
    const fetchLimit = limit || 10
    if (lastMessage) {
      const filterFromIndex = filteredMessages.findIndex((x) => x.messageId === lastMessage.messageId) + 1
      return Promise.resolve(filteredMessages.slice(filterFromIndex, filterFromIndex + fetchLimit))
    }

    return Promise.resolve(filteredMessages.slice(0, fetchLimit))
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

    if (!result) {
      return Promise.resolve(new Error("Message does not exist."))
    }

    return Promise.resolve(result)
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
