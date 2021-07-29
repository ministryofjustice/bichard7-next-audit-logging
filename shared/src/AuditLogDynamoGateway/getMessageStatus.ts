import type { AuditLogEvent } from "../types"
import { AuditLogStatus } from "../types"

const getMessageStatus = (event: AuditLogEvent): string => {
  switch (event.eventType) {
    case "PNC Response received":
      return AuditLogStatus.completed
    case "PNC Response not received":
      return AuditLogStatus.error
    case "Retrying failed message":
      return AuditLogStatus.retrying
    default:
      return AuditLogStatus.processing
  }
}

export default getMessageStatus
