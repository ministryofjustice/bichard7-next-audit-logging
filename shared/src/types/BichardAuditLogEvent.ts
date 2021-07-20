import AuditLogEvent from "./AuditLogEvent"
import type BichardAuditLogEventOptions from "./BichardAuditLogEventOptions"

export default class BichardAuditLogEvent extends AuditLogEvent {
  public readonly s3Path: string

  public readonly eventSourceArn: string

  constructor({ eventSourceArn, s3Path, ...options }: BichardAuditLogEventOptions) {
    super(options)

    this.eventSourceArn = eventSourceArn
    this.s3Path = s3Path
  }
}
