import type { AuditLogEvent } from "../types"
import { AuditLogStatus } from "../types"

const getMessageStatus = (event: AuditLogEvent): string | null => {
  if (event.category === "error") {
    return AuditLogStatus.error
  }

  switch (event.eventType) {
    case "PNC Response received":
    case "PNC Update applied successfully":
      return AuditLogStatus.completed
    case "Retrying failed message":
      return AuditLogStatus.retrying
    case "Message Sent to Bichard":
      return AuditLogStatus.processing
    default:
      return null
  }
}

export default getMessageStatus
