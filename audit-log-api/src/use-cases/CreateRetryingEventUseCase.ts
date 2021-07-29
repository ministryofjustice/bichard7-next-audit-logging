import type { ApiClient } from "@bichard/api-client"
import type { PromiseResult } from "shared"
import { AuditLogEvent } from "shared"

export default class CreateRetryingEventUseCase {
  constructor(private readonly apiClient: ApiClient) {}

  create(messageId: string): PromiseResult<void> {
    const event = new AuditLogEvent({
      category: "information",
      timestamp: new Date(),
      eventType: "Retrying failed message",
      eventSource: "Audit Log Api"
    })

    return this.apiClient.createEvent(messageId, event)
  }
}
