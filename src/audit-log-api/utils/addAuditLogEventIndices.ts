import type { AuditLogEvent } from "src/shared/types"
import shouldLogForAutomationReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForTopExceptionsReport"

const addAuditLogEventIndices = (event: AuditLogEvent): AuditLogEvent => {
  event._automationReport = shouldLogForAutomationReport(event) ? 1 : 0
  event._topExceptionsReport = shouldLogForTopExceptionsReport(event) ? 1 : 0

  return event
}

export default addAuditLogEventIndices
