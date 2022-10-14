import type AuditLogEventOptions from "./AuditLogEventOptions"
import type EventCategory from "./EventCategory"
import type KeyValuePair from "./KeyValuePair"

// TODO: Split this into a type an an implementation
export default class AuditLogEvent {
  public readonly eventSource: string

  public readonly category: EventCategory

  public readonly eventType: string

  public readonly timestamp: string

  public readonly eventSourceQueueName?: string

  public readonly eventXml?: string

  public readonly attributes: KeyValuePair<string, unknown> = {}

  constructor(options: AuditLogEventOptions) {
    this.eventSource = options.eventSource
    this.category = options.category
    this.eventType = options.eventType
    this.timestamp = options.timestamp.toISOString()
    this.eventSourceQueueName = options.eventSourceQueueName
    this.eventXml = options.eventXml
    this.attributes = options.attributes ?? {}
  }

  addAttribute(name: string, value: unknown): void {
    this.attributes[name] = value
  }
}
