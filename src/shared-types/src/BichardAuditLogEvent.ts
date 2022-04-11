import AuditLogEvent from "./AuditLogEvent"
import type BichardAuditLogEventOptions from "./BichardAuditLogEventOptions"

export default class BichardAuditLogEvent extends AuditLogEvent {
  public readonly eventXml?: string

  public readonly eventSourceArn: string

  public readonly eventSourceQueueName: string

  constructor({ eventSourceQueueName, eventSourceArn, eventXml, ...options }: BichardAuditLogEventOptions) {
    super(options)

    this.eventSourceQueueName = eventSourceQueueName
    this.eventSourceArn = eventSourceArn
    this.eventXml = eventXml
  }
}
