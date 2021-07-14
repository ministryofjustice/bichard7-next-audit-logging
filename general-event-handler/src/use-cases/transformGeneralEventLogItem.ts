import type { EventCategory, EventDetails } from "src/types"
import { AuditLogEvent } from "src/types"

const mapEventCategory = (category: string): EventCategory => {
  switch (category) {
    case "error":
      return "error"

    case "warning":
      return "warning"

    default:
      return "information"
  }
}

export default (eventDetails: EventDetails): AuditLogEvent => {
  const { eventCategory, eventDateTime, eventType, componentID, nameValuePairs } = eventDetails

  const category = mapEventCategory(eventCategory)
  const timestamp = new Date(eventDateTime)

  const event = new AuditLogEvent({
    eventSource: componentID,
    category,
    eventType,
    timestamp
  })

  const attributes = nameValuePairs?.nameValuePair
  if (attributes && Array.isArray(attributes)) {
    attributes.forEach((attribute) => event.addAttribute(attribute.name, attribute.value))
  }

  return event
}
