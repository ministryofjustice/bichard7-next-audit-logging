import AuditLogEvent from "src/AuditLogEvent"

const getMessageStatus = (event: AuditLogEvent): string => {
  switch (event.eventType) {
    case "Message Sent to Bichard":
      return "Processing"
    case "PNC Response received":
      return "Complete"
    default:
      return event.eventType // Error status
  }
}

export default getMessageStatus
