import AuditLogEvent from "../AuditLogEvent"
import AuditLogStatus from "../AuditLogStatus"

const getMessageStatus = (event: AuditLogEvent): string => {
  switch (event.eventType) {
    case "PNC Response received":
      return AuditLogStatus.completed
    case "PNC Response not received":
      return AuditLogStatus.error
    default:
      return AuditLogStatus.processing
  }
}

export default getMessageStatus
