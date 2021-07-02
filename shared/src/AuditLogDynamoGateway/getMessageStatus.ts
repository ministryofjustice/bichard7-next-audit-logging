import AuditLogEvent from "src/AuditLogEvent"
import { AuditLogStatus } from "../utils"

interface GetMessageStatusResult {
  status: string
  lastEventType?: string
}

const getMessageStatus = (event: AuditLogEvent): GetMessageStatusResult => {
  let status: string
  switch (event.eventType) {
    case "PNC Response received":
      status = AuditLogStatus.completed
      break
    case "PNC Response not received":
      status = AuditLogStatus.error
      break
    default:
      status = AuditLogStatus.processing
  }

  return { status, lastEventType: event.eventType }
}

export default getMessageStatus
