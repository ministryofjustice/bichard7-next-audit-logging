import AuditLogEvent from "src/AuditLogEvent"
import { AuditLogStatus } from "../utils"

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
