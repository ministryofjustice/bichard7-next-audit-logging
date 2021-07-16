import type { PromiseResult, AuditLogDynamoGateway, AuditLogEvent } from "shared"

export default class FetchEventsUseCase {
  constructor(private readonly gateway: AuditLogDynamoGateway) {}

  get(messageId: string): PromiseResult<AuditLogEvent[]> {
    return this.gateway.fetchEvents(messageId)
  }
}
