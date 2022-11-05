import type AuditLogEventOptions from "./AuditLogEventOptions"

export default interface BichardAuditLogEventOptions extends AuditLogEventOptions {
  eventXml?: string
  eventSourceArn: string
  eventSourceQueueName: string
}
