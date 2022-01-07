import type { AuditLogDynamoGateway, BichardAuditLogEvent, PromiseResult } from "shared-types"
import { isError } from "shared-types"

export default class GetLastFailedMessageEventUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGateway) {}

  async get(messageId: string): PromiseResult<BichardAuditLogEvent> {
    const events = (await this.auditLogDynamoGateway.fetchEvents(messageId)) as BichardAuditLogEvent[]

    if (isError(events)) {
      return events
    }

    const failedEvents = events.filter(
      (event) => event.category === "error" && event.s3Path && event.eventSourceQueueName
    )

    if (failedEvents.length === 0) {
      return new Error(`No events found for message '${messageId}'`)
    }

    return failedEvents.slice(-1)[0]
  }
}
