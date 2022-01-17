import type { AuditLogEvent } from "shared-types"
import { AuditLogStatus } from "shared-types"

const getMessageStatus = (event: AuditLogEvent): string | null => {
  if (event.category === "error") {
    return AuditLogStatus.error
  }

  switch (event.eventType) {
    case "PNC Update applied successfully":
    case "Hearing Outcome ignored as it contains no offences":
    case "Hearing Outcome ignored as no offences are recordable":
      return AuditLogStatus.completed
    case "Retrying failed message":
      return AuditLogStatus.retrying
    case "Message Sent to Bichard":
    case "Hearing Outcome passed to Error List":
      return AuditLogStatus.processing
    case "Record archived":
      return AuditLogStatus.archived
    default:
      return null
  }
}

export default getMessageStatus