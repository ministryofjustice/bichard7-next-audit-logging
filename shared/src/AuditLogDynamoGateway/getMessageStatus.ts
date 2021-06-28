import AuditLogEvent from "src/AuditLogEvent"

const getMessageStatus = (event: AuditLogEvent): string => {
  switch (event.eventType) {
    case "PNC Response received":
      return "Completed"
    case "PNC Response not received":
      return event.eventType // Error status
    default:
      return "Processing"
  }
}

export default getMessageStatus
