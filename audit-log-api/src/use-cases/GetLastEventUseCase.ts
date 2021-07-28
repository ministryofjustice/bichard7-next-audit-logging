import type { AuditLogDynamoGateway, BichardAuditLogEvent, PromiseResult } from "shared"
import { isError } from "shared"

export default class GetLastEventUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGateway) {}

  async get(messageId: string): PromiseResult<BichardAuditLogEvent> {
    const events = await this.auditLogDynamoGateway.fetchEvents(messageId)

    if (isError(events)) {
      return events
    }

    if (events.length === 0) {
      return new Error(`No events found for message '${messageId}'`)
    }

    const lastEvent = events[0] as BichardAuditLogEvent
    if (lastEvent.category !== "error") {
      return new Error("This message has not failed and cannot be retried")
    }

    if (!lastEvent.s3Path || !lastEvent.eventSourceQueueName) {
      return new Error("Both s3Path and eventSourceQueueName in the failed event must have values")
    }

    return lastEvent
  }
}
