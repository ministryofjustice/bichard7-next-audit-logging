import type { AuditLog, PromiseResult } from "src/shared/types"
import { AuditLogEvent, EventCode } from "src/shared/types"
import { AuditLogDynamoGatewayInterface } from "../gateways/dynamo"

export default class SanitiseAuditLogUseCase {
  constructor(private readonly auditLogDynamoGateway: AuditLogDynamoGatewayInterface) {}

  call(auditLog: AuditLog): PromiseResult<void> {
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

    auditLog.events.push(
      new AuditLogEvent({
        category: "information",
        timestamp: new Date(),
        eventCode: EventCode.Sanitised,
        eventType: "Sanitised message",
        eventSource: "Audit Log Api"
      })
    )

    auditLog.isSanitised = 1
    delete auditLog.nextSanitiseCheck

    return this.auditLogDynamoGateway.replaceAuditLog(auditLog, auditLog.version)
  }
}
