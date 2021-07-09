import type { EventCategory } from "src/types"

export default interface AuditLogEventOptions {
  eventSource: string
  category: EventCategory
  eventType: string
  timestamp: Date
}
