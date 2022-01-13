import type { ApiClient, PromiseResult } from "shared-types"
import { AuditLogEvent } from "shared-types"

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
