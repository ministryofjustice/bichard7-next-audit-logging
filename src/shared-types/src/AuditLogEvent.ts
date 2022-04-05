import type EventCategory from "./EventCategory"
import type KeyValuePair from "./KeyValuePair"
import type AuditLogEventOptions from "./AuditLogEventOptions"

// TODO: Split this into a type an an implementation
export default class AuditLogEvent {
  public readonly eventSource: string

  public readonly category: EventCategory

  public readonly eventType: string

  public readonly timestamp: string

  public readonly attributes: KeyValuePair<string, unknown> = {}

  constructor(options: AuditLogEventOptions) {
    this.eventSource = options.eventSource
    this.category = options.category
    this.eventType = options.eventType
    this.timestamp = options.timestamp.toISOString()
  }

  addAttribute(name: string, value: unknown): void {
    const maxStringLength = 1000
    this.attributes[name] =
      typeof value === "string" && value.length > maxStringLength ? "See original log file in S3" : value
  }
}
