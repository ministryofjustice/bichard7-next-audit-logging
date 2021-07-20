import AuditLogEvent from "./AuditLogEvent"
import type BichardAuditLogEventOptions from "./BichardAuditLogEventOptions"

export default class BichardAuditLogEvent extends AuditLogEvent {
  public readonly s3Path: string

  public readonly eventSourceArn: string

  constructor(options: BichardAuditLogEventOptions) {
    super(options)
    this.eventSourceArn = options.eventSourceArn
    this.s3Path = options.s3Path
  }
}
