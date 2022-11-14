import type AuditLogEvent from "./AuditLogEvent"

interface AuditLogErrorEvent extends AuditLogEvent {
  category: "error"
  eventXml: string
  eventSourceQueueName: string
}

export default AuditLogErrorEvent
