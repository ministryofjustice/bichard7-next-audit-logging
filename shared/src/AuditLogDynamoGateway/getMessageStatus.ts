import AuditLogEvent from "src/AuditLogEvent"

interface GetMessageStatusResult {
  status: string
  errorMessage?: string
}

const getMessageStatus = (event: AuditLogEvent): GetMessageStatusResult => {
  switch (event.eventType) {
    case "PNC Response received":
      return { status: "Completed" }
    case "PNC Response not received":
      return { status: "Error", errorMessage: event.eventType }
    default:
      return { status: "Processing" }
  }
}

export default getMessageStatus
