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

    return events[0] as BichardAuditLogEvent
  }
}
