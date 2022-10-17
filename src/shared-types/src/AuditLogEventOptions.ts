import type EventCategory from "./EventCategory"
import type KeyValuePair from "./KeyValuePair"

export default interface AuditLogEventOptions {
  eventSource: string
  category: EventCategory
  eventType: string
  timestamp: Date
  eventSourceQueueName?: string
  eventXml?: string
  attributes?: KeyValuePair<string, unknown>
}
