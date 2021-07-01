import { KeyValuePair } from "shared"
import AuditLogEventOptions from "./AuditLogEventOptions"
import EventCategory from "./EventCategory"

// TODO: This will need to move into shared once the API endpoint exists.
export default class AuditLogEvent {
  public readonly eventSource: string

  public readonly category: EventCategory

  public readonly eventType: string

  public readonly timestamp: string

  public readonly attributes: KeyValuePair = {}

  constructor(options: AuditLogEventOptions) {
    this.eventSource = options.eventSource
    this.category = options.category
    this.eventType = options.eventType
    this.timestamp = options.timestamp.toISOString()
  }

  addAttribute(name: string, value: string): void {
    this.attributes[name] = value
  }
}
