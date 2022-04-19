import type { AuditLog, AuditLogDynamoGateway, PromiseResult } from "shared-types"
import { AuditLogEvent } from "shared-types"

export default class SanitiseAuditLogUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGateway) {}

  call(auditLog: AuditLog): PromiseResult<AuditLog> {
    for (const auditLogEvent of auditLog.events) {
      delete auditLogEvent.attributes.AmendedPNCUpdateDataset
      delete auditLogEvent.attributes.AmendedHearingOutcome
      delete auditLogEvent.attributes["Original Hearing Outcome / PNC Update Dataset"]
      delete auditLogEvent.attributes.OriginalHearingOutcome
      delete auditLogEvent.attributes.OriginalPNCUpdateDataset
      delete auditLogEvent.attributes.PNCUpdateDataset
    }

    auditLog.events.push(
      new AuditLogEvent({
        category: "information",
        timestamp: new Date(),
        eventType: "Sanitised message",
        eventSource: "Audit Log Api"
      })
    )

    auditLog.status = "Sanitised"

    return this.auditLogDynamoGateway.update(auditLog)
  }
}
