import type { AuditLogEvent } from "shared-types"
import shouldLogForAutomationReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForTopExceptionsReport"
import transformAuditLogEventAttributes from "./transformAuditLogEventAttributes"

const transformAuditLogEvent = (event: AuditLogEvent): AuditLogEvent => {
  const transformedEvent = transformAuditLogEventAttributes(event)

  transformedEvent._automationReport = shouldLogForAutomationReport(transformedEvent)
  transformedEvent._topExceptionsReport = shouldLogForTopExceptionsReport(transformedEvent)

  return transformedEvent
}

export default transformAuditLogEvent
