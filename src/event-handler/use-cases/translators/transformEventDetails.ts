import type { ApiAuditLogEvent, EventCategory } from "src/shared/types"
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

export default (eventDetails: EventDetails, eventXml: string, eventSourceQueueName: string): ApiAuditLogEvent => {
  const { eventCategory, eventDateTime, eventType, componentID, nameValuePairs } = eventDetails
  const category = mapEventCategory(eventCategory)

  const event: ApiAuditLogEvent = {
    eventSource: componentID,
    category,
    eventType,
    timestamp: new Date(eventDateTime).toISOString(),
    eventSourceQueueName,
    ...(category === "error" ? { eventXml } : {}),
    attributes: {},
    eventCode: "unknown"
  }

  const attributes = nameValuePairs?.nameValuePair

  if (attributes && Array.isArray(attributes)) {
    attributes.forEach((attribute) => {
      if (attribute.name === "eventCode") {
        event.eventCode = attribute.value
      } else if (attribute.name.toLowerCase() === "user") {
        event.user = attribute.value
      }
      event.attributes![attribute.name] = attribute.value
    })
  }

  return event
}
