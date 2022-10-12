import type EventCategory from "./EventCategory"
import type KeyValuePair from "./KeyValuePair"

export default interface AuditLogEventOptions {
  eventSource: string
  category: EventCategory
  eventType: string
  timestamp: Date
  attributes?: KeyValuePair<string, unknown>
}
