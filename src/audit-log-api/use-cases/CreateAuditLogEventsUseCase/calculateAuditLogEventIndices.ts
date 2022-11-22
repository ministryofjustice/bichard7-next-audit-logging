import shouldLogForAutomationReport from "src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "src/audit-log-api/gateways/dynamo/AuditLogDynamoGateway/shouldLogForTopExceptionsReport"
import { ApiAuditLogEvent, DynamoAuditLogEvent } from "src/shared/types"

const calculateAuditLogEventIndices = (
  event: ApiAuditLogEvent
): Pick<DynamoAuditLogEvent, "_automationReport" | "_topExceptionsReport"> => ({
  _automationReport: shouldLogForAutomationReport(event) ? 1 : 0,
  _topExceptionsReport: shouldLogForTopExceptionsReport(event) ? 1 : 0
})

export default calculateAuditLogEventIndices
