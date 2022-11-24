import type { ApiAuditLogEvent } from "./AuditLogEvent"

interface AuditLogErrorEvent extends ApiAuditLogEvent {
  category: "error"
  eventXml: string
  eventSourceQueueName: string
}

export default AuditLogErrorEvent
