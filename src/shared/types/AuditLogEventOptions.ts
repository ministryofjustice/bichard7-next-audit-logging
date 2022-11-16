import type { AuditLogEventAttributes } from "./AuditLogEvent"
import type EventCategory from "./EventCategory"

export default interface AuditLogEventOptions {
  _automationReport?: number
  _id?: string
  _messageId?: string
  _topExceptionsReport?: number
  attributes?: AuditLogEventAttributes
  category: EventCategory
  eventCode?: string
  eventSource: string
  eventSourceQueueName?: string
  eventType: string
  eventXml?: string
  timestamp: Date | string
  user?: string
}
