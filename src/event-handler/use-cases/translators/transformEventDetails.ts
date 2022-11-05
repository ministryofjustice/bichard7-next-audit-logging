import type { EventCategory } from "src/shared/types"
import { BichardAuditLogEvent } from "src/shared/types"
import type { EventDetails } from "../../types"

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

export default (
  eventDetails: EventDetails,
  eventXml: string,
  eventSourceArn: string,
  eventSourceQueueName: string
): BichardAuditLogEvent => {
  const { eventCategory, eventDateTime, eventType, componentID, nameValuePairs } = eventDetails
  const category = mapEventCategory(eventCategory)
  const timestamp = new Date(eventDateTime)

  const event = new BichardAuditLogEvent({
    eventSource: componentID,
    category,
    eventType,
    timestamp,
    eventSourceArn,
    eventSourceQueueName,
    ...(category === "error" ? { eventXml } : {})
  })

  const attributes = nameValuePairs?.nameValuePair
  if (attributes && Array.isArray(attributes)) {
    attributes.forEach((attribute) => event.addAttribute(attribute.name, attribute.value))
  }

  return event
}
