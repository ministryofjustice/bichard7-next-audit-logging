import type EventCategory from "./EventCategory"

export default interface AuditLogEventOptions {
  eventSource: string
  category: EventCategory
  eventType: string
  timestamp: Date
}
