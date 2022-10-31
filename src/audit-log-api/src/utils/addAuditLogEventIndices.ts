import type { AuditLogEvent } from "shared-types"
import shouldLogForAutomationReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForTopExceptionsReport"

const addAuditLogEventIndices = (event: AuditLogEvent): AuditLogEvent => {
  event._automationReport = shouldLogForAutomationReport(event)
  event._topExceptionsReport = shouldLogForTopExceptionsReport(event)

  return event
}

export default addAuditLogEventIndices
