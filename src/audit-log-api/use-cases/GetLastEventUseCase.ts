import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import type AuditLogErrorEvent from "src/shared/types/AuditLogErrorEvent"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"

export default class GetLastFailedMessageEventUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface) {}

  async get(messageId: string): PromiseResult<AuditLogErrorEvent | undefined> {
    const result = await this.auditLogDynamoGateway.fetchOne(messageId)
    if (isError(result) || typeof result === "undefined") {
      return result
    }

    const { events } = result

    const failedEvents = events.filter(
      (event) => event.category === "error" && (event.eventXml || "s3Path" in event) && event.eventSourceQueueName
    )

    if (failedEvents.length === 0) {
      return new Error(`No events found for message '${messageId}'`)
    }

    const failedEvent = failedEvents.slice(-1)[0]

    return failedEvent as AuditLogErrorEvent
  }
}
