import type EventCategory from "./EventCategory"
import type KeyValuePair from "./KeyValuePair"

export default interface AuditLogEventOptions {
  _automationReport?: number
  _id?: string
  _messageId?: string
  _topExceptionsReport?: number
  attributes?: KeyValuePair<string, unknown>
  category: EventCategory
  eventCode?: string
  eventSource: string
  eventSourceQueueName?: string
  eventType: string
  eventXml?: string
  timestamp: Date | string
  user?: string
}
