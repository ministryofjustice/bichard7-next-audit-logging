import type { AuditLogEvent } from "../types"
import { AuditLogStatus } from "../types"

const getMessageStatus = (event: AuditLogEvent): string => {
  if (event.category === "error") {
    return AuditLogStatus.error
  }

  switch (event.eventType) {
    case "PNC Response received":
      return AuditLogStatus.completed
    case "Retrying failed message":
      return AuditLogStatus.retrying
    default:
      return AuditLogStatus.processing
  }
}

export default getMessageStatus
