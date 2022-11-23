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
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface) {}

  // TODO: We need to handle the `sensitive` flag that Bichard sets
  async call(auditLog: DynamoAuditLog): PromiseResult<void> {
    const updatedEvents: DynamoAuditLogEvent[] = []

    for (const event of auditLog.events) {
      if (event.attributes) {
        const deleted =
          delete event.attributes.AmendedPNCUpdateDataset ||
          delete event.attributes.AmendedHearingOutcome ||
          delete event.attributes["Original Hearing Outcome / PNC Update Dataset"] ||
          delete event.attributes.OriginalHearingOutcome ||
          delete event.attributes.OriginalPNCUpdateDataset ||
          delete event.attributes.PNCUpdateDataset

        if (deleted) {
          updatedEvents.push(event)
        }
      }
    }

    const eventReplaceResult = await this.auditLogDynamoGateway.replaceAuditLogEvents(updatedEvents)
    if (isError(eventReplaceResult)) {
      return eventReplaceResult
    }

    auditLog.isSanitised = 1
    delete auditLog.nextSanitiseCheck

    const logReplaceResult = await this.auditLogDynamoGateway.replaceAuditLog(auditLog, auditLog.version)
    if (isError(logReplaceResult)) {
      return logReplaceResult
    }

    const sanitiseEvent: ApiAuditLogEvent = {
      category: "information",
      eventCode: EventCode.Sanitised,
      eventSource: "Audit Log Api",
      eventType: "Sanitised message",
      timestamp: new Date().toISOString()
    }
    const createAuditLogEventsUseCase = new CreateAuditLogEventsUseCase(this.auditLogDynamoGateway)
    await createAuditLogEventsUseCase.create(auditLog.messageId, [sanitiseEvent])
  }
}
