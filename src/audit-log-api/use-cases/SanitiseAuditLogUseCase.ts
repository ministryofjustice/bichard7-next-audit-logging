import type { DynamoAuditLog, PromiseResult } from "src/shared/types"
import { AuditLogEvent, EventCode } from "src/shared/types"
import type { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"
import { CreateAuditLogEventsUseCase } from "./CreateAuditLogEventsUseCase"

export default class SanitiseAuditLogUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface) {}

  async call(auditLog: DynamoAuditLog): PromiseResult<void> {
    ;[auditLog.events, auditLog.automationReport?.events, auditLog.topExceptionsReport?.events].forEach((events) => {
      if (!events) {
        return
      }

      for (const auditLogEvent of events) {
        delete auditLogEvent.attributes.AmendedPNCUpdateDataset
        delete auditLogEvent.attributes.AmendedHearingOutcome
        delete auditLogEvent.attributes["Original Hearing Outcome / PNC Update Dataset"]
        delete auditLogEvent.attributes.OriginalHearingOutcome
        delete auditLogEvent.attributes.OriginalPNCUpdateDataset
        delete auditLogEvent.attributes.PNCUpdateDataset
      }
    })

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
