import type AuditLogEventOptions from "./AuditLogEventOptions"

export default interface BichardAuditLogEventOptions extends AuditLogEventOptions {
  s3Path: string
  eventSourceArn: string
  eventSourceQueueName: string
}
