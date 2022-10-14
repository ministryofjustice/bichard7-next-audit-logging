import type { AuditLogEvent, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import type { AuditLogDynamoGateway } from "../gateways/dynamo"
import type LookupEventValuesUseCase from "./LookupEventValuesUseCase"

export default class FetchEventsUseCase {
  constructor(
    private readonly gateway: AuditLogDynamoGateway,
    private readonly lookupEventValuesUseCase: LookupEventValuesUseCase
  ) {}

  async get(messageId: string, fetchLargeObjects = true): PromiseResult<AuditLogEvent[]> {
    const fetchedEvents = await this.gateway.fetchEvents(messageId)

    if (isError(fetchedEvents)) {
      return fetchedEvents
    }

    const events = []
    for (const fetchedEvent of fetchedEvents) {
      if (fetchLargeObjects) {
        const lookupEventResult = await this.lookupEventValuesUseCase.execute(fetchedEvent)

        if (isError(lookupEventResult)) {
          return lookupEventResult
        }
        events.push(lookupEventResult)
      } else {
        events.push(fetchedEvent)
      }
    }

    return events
  }
}
