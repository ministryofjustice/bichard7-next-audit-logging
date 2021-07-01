import AuditLogEvent from "src/AuditLogEvent"
import { AuditLogStatus } from "../utils"

interface GetMessageStatusResult {
  status: string
  errorMessage?: string
}

const getMessageStatus = (event: AuditLogEvent): GetMessageStatusResult => {
  switch (event.eventType) {
    case "PNC Response received":
      return { status: AuditLogStatus.completed }
    case "PNC Response not received":
      return { status: AuditLogStatus.error, errorMessage: event.eventType }
    default:
      return { status: AuditLogStatus.processing }
  }
}

export default getMessageStatus
