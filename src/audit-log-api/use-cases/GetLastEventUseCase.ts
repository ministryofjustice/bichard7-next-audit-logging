import type { AuditLogEvent, PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import AuditLogErrorEvent from "src/shared/types/AuditLogErrorEvent"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import type LookupEventValuesUseCase from "./LookupEventValuesUseCase"

export default class GetLastFailedMessageEventUseCase {
  constructor(
    private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface,
    private readonly lookupEventValues: LookupEventValuesUseCase
  ) {}

  async get(messageId: string): PromiseResult<AuditLogErrorEvent> {
    const events = (await this.auditLogDynamoGateway.fetchEvents(messageId)) as AuditLogEvent[]

    if (isError(events)) {
      return events
    }

    const failedEvents = events.filter(
      (event) => event.category === "error" && (event.eventXml || "s3Path" in event) && event.eventSourceQueueName
    )

    if (failedEvents.length === 0) {
      return new Error(`No events found for message '${messageId}'`)
    }

    const failedEvent = failedEvents.slice(-1)[0]

    return this.lookupEventValues.execute(failedEvent) as PromiseResult<AuditLogErrorEvent>
  }
}
