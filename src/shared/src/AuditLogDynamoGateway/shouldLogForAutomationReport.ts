import type { AuditLogEvent } from "shared-types"

const automationReportEventTypes = [
  "Hearing Outcome passed to Error List",
  "PNC Update added to Error List (PNC message construction)",
  "PNC Update added to Error List (Unexpected PNC response)",
  "Exceptions generated",
  "Exception marked as resolved by user",
  "PNC Update applied successfully"
]

export default (event: AuditLogEvent): boolean => {
  return automationReportEventTypes.includes(event.eventType)
}

export { automationReportEventTypes }
