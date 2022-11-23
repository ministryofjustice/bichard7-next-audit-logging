import {
  ApiAuditLogEvent,
  DynamoAuditLog,
  DynamoAuditLogEvent,
  EventCode,
  isError,
  PromiseResult
} from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { CreateAuditLogEventsUseCase } from "./CreateAuditLogEventsUseCase"

export default class SanitiseAuditLogUseCase {
  private createAuditLogEventsUseCase: CreateAuditLogEventsUseCase

  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface) {
    this.createAuditLogEventsUseCase = new CreateAuditLogEventsUseCase(this.auditLogDynamoGateway)
  }

  // TODO: We need to handle the `sensitive` flag that Bichard sets
  async call(auditLog: DynamoAuditLog): PromiseResult<void> {
    const updatedEvents: DynamoAuditLogEvent[] = []

    for (const event of auditLog.events) {
      if (event.attributes) {
        const deleted = [
          delete event.attributes.AmendedPNCUpdateDataset,
          delete event.attributes.AmendedHearingOutcome,
          delete event.attributes["Original Hearing Outcome / PNC Update Dataset"],
          delete event.attributes.OriginalHearingOutcome,
          delete event.attributes.OriginalPNCUpdateDataset,
          delete event.attributes.PNCUpdateDataset
        ]

        if (deleted.filter((d) => d).length > 0) {
          updatedEvents.push(event)
        }
      }
    }

    const replaceResult = await this.auditLogDynamoGateway.replaceAuditLogEvents(updatedEvents)
    if (isError(replaceResult)) {
      return replaceResult
    }

    const sanitiseEvent: ApiAuditLogEvent = {
      category: "information",
      eventCode: EventCode.Sanitised,
      eventSource: "Audit Log Api",
      eventType: "Sanitised message",
      timestamp: new Date().toISOString()
    }

    const createResult = await this.createAuditLogEventsUseCase.create(auditLog.messageId, [sanitiseEvent])
    if (createResult.resultType !== "success") {
      console.log(createResult)
      return Error("Failed to add sanitised audit log event")
    }
  }
}
