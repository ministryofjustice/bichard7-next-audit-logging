import type { ApiClient, PromiseResult, ApiAuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"

export default class CreateRetryingEventUseCase {
  constructor(private readonly apiClient: ApiClient) {}

  create(messageId: string): PromiseResult<void> {
    const event: ApiAuditLogEvent = {
      attributes: {},
      category: "information",
      timestamp: new Date().toISOString(),
      eventType: "Retrying failed message",
      eventCode: EventCode.RetryingMessage,
      eventSource: "Audit Log Api"
    }

    return this.apiClient.createEvent(messageId, event)
  }
}
