import type { AuditLogEvent } from "../types"

const automationReportEventTypes = [
  "Hearing Outcome passed to Error List",
  "PNC Update added to Error List",
  "Exception marked as resolved by user",
  "PNC Update applied successfully"
]

export default (event: AuditLogEvent): boolean => {
  return automationReportEventTypes.includes(event.eventType)
}

export { automationReportEventTypes }
