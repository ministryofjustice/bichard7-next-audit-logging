import type AuditLogEventOptions from "./AuditLogEventOptions"
import type EventCategory from "./EventCategory"
import type KeyValuePair from "./KeyValuePair"

// TODO: Split this into a type an an implementation
export default class AuditLogEvent {
  public readonly attributes: KeyValuePair<string, unknown> = {}

  public readonly category: EventCategory

  public readonly eventSource: string

  public readonly eventSourceQueueName?: string

  public readonly eventType: string

  public readonly eventXml?: string

  public readonly timestamp: string

  public _automationReport?: boolean

  public _topExceptionsReport?: boolean

  public eventCode?: string

  public user?: string

  constructor(options: AuditLogEventOptions) {
    this.eventSource = options.eventSource
    this.category = options.category
    this.eventType = options.eventType
    this.eventCode = options.eventCode
    this.user = options.user
    this._automationReport = options._automationReport
    this._topExceptionsReport = options._topExceptionsReport
    this.timestamp = options.timestamp.toISOString()
    this.eventSourceQueueName = options.eventSourceQueueName
    this.eventXml = options.eventXml
    this.attributes = options.attributes ?? {}
  }

  addAttribute(name: string, value: unknown): void {
    this.attributes[name] = value
  }
}
