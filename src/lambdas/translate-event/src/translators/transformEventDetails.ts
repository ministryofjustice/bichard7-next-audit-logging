import type { EventDetails } from "src/types"
import type { EventCategory } from "shared"
import { BichardAuditLogEvent } from "shared"

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

export default (eventDetails: EventDetails, s3Path: string, eventSourceArn: string): BichardAuditLogEvent => {
  const { eventCategory, eventDateTime, eventType, componentID, nameValuePairs } = eventDetails
  const category = mapEventCategory(eventCategory)
  const timestamp = new Date(eventDateTime)

  const event = new BichardAuditLogEvent({
    eventSource: componentID,
    category,
    eventType,
    timestamp,
    s3Path,
    eventSourceArn
  })

  const attributes = nameValuePairs?.nameValuePair
  if (attributes && Array.isArray(attributes)) {
    attributes.forEach((attribute) => event.addAttribute(attribute.name, attribute.value))
  }

  return event
}
