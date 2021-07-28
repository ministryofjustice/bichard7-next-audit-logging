import type { ApiClient } from "@bichard/api-client"
import type { AuditLogEvent, PromiseResult } from "shared"

export default class FakeApiClient implements ApiClient {
  private error?: Error

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

  reset(): void {
    this.error = undefined
  }
}
