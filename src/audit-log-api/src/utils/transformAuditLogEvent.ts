import type { AuditLogEvent } from "shared-types"
import shouldLogForAutomationReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForAutomationReport"
import shouldLogForTopExceptionsReport from "../gateways/dynamo/AuditLogDynamoGateway/shouldLogForTopExceptionsReport"

const transformAuditLogEvent = (event: AuditLogEvent): AuditLogEvent => {
  if (event.attributes.eventCode && typeof event.attributes.eventCode === "string") {
    event.eventCode = event.attributes.eventCode
    delete event.attributes.eventCode
  }

  const user = event.attributes.user ?? event.attributes.User
  if (typeof user === "string") {
    event.user = user
    delete event.attributes.user
    delete event.attributes.User
  }

  if (shouldLogForAutomationReport(event)) {
    event.automationReport = true
  }

  if (shouldLogForTopExceptionsReport(event)) {
    event.topExceptionsReport = true
  }

  return event
}

export default transformAuditLogEvent
