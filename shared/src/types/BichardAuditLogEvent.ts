import AuditLogEvent from "./AuditLogEvent"
import type BichardAuditLogEventOptions from "./BichardAuditLogEventOptions"

export default class BichardAuditLogEvent extends AuditLogEvent {
  public readonly s3Path: string

  public readonly eventSourceArn: string

  public readonly eventSourceQueueName: string

  constructor({ eventSourceQueueName, eventSourceArn, s3Path, ...options }: BichardAuditLogEventOptions) {
    super(options)

    this.eventSourceQueueName = eventSourceQueueName
    this.eventSourceArn = eventSourceArn
    this.s3Path = s3Path
  }
}
