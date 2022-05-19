import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { AuditLogEvent, EventType } from "shared-types"

export default class SanitiseAuditLogUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGateway) {}

  call(auditLog: AuditLog): PromiseResult<AuditLog> {
    ;[auditLog.events, auditLog.automationReport.events, auditLog.topExceptionsReport.events].forEach((events) => {
      for (const auditLogEvent of events) {
        delete auditLogEvent.attributes.AmendedPNCUpdateDataset
        delete auditLogEvent.attributes.AmendedHearingOutcome
        delete auditLogEvent.attributes["Original Hearing Outcome / PNC Update Dataset"]
        delete auditLogEvent.attributes.OriginalHearingOutcome
        delete auditLogEvent.attributes.OriginalPNCUpdateDataset
        delete auditLogEvent.attributes.PNCUpdateDataset
      }
    })

    auditLog.events.push(
      new AuditLogEvent({
        category: "information",
        timestamp: new Date(),
        eventType: EventType.SanitisedMessage,
        eventSource: "Audit Log Api"
      })
    )

    return this.auditLogDynamoGateway.update(auditLog)
  }
}
