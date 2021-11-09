import type { ApiClient } from "@bichard/api-client"
import type { AuditLog, AuditLogEvent, PromiseResult } from "shared"

export default class FakeApiClient implements ApiClient {
  private messages: AuditLog[] = []

  private error?: Error

  getMessage(messageId: string): PromiseResult<AuditLog> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    const message = this.messages.filter((x) => x.messageId === messageId)[0]
    return Promise.resolve(message)
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createAuditLog(auditLog: AuditLog): PromiseResult<void> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve()
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createEvent(messageId: string, event: AuditLogEvent): PromiseResult<void> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    return Promise.resolve()
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(messages?: AuditLog[]): void {
    this.error = undefined
    this.messages = messages ?? []
  }
}
