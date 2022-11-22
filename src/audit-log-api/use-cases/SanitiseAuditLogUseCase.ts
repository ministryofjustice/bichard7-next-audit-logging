import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { AuditLogEvent, EventCode } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { CreateAuditLogEventsUseCase } from "./CreateAuditLogEventsUseCase"

export default class SanitiseAuditLogUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface) {}

  async call(auditLog: DynamoAuditLog): PromiseResult<void> {
    const events = auditLog.events
    if (!events) {
      return
    }

    // TODO: We need to handle the `sensitive` flag that Bichard sets

    for (const event of events) {
      if (event.attributes) {
        delete event.attributes.AmendedPNCUpdateDataset
        delete event.attributes.AmendedHearingOutcome
        delete event.attributes["Original Hearing Outcome / PNC Update Dataset"]
        delete event.attributes.OriginalHearingOutcome
        delete event.attributes.OriginalPNCUpdateDataset
        delete event.attributes.PNCUpdateDataset
      }
    }

    const sanitiseEvent = new AuditLogEvent({
      category: "information",
      timestamp: new Date(),
      eventCode: EventCode.Sanitised,
      eventType: "Sanitised message",
      eventSource: "Audit Log Api"
    })

    auditLog.isSanitised = 1
    delete auditLog.nextSanitiseCheck

    // TODO: We need to sanitise the individual events in the separate events table
    // Note: We are going to do this once we have moved the existing events to the new table
    // The sanitisation job has been paused in the meantime
    await this.auditLogDynamoGateway.replaceAuditLog(auditLog, auditLog.version)
    const createAuditLogEventsUseCase = new CreateAuditLogEventsUseCase(this.auditLogDynamoGateway)
    createAuditLogEventsUseCase.create(auditLog.messageId, [sanitiseEvent])
  }
}
