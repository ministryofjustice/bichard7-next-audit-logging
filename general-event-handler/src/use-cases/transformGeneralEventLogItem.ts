import { AuditLogEvent, EventCategory, GeneralEventLogItem } from "src/types"

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

export default (generalEventLogItem: GeneralEventLogItem): AuditLogEvent => {
  const category = mapEventCategory(generalEventLogItem.logEvent.eventCategory)
  const timestamp = new Date(generalEventLogItem.logEvent.eventDateTime)

  const event = new AuditLogEvent({
    eventSource: generalEventLogItem.logEvent.componentID,
    category,
    eventType: generalEventLogItem.logEvent.eventType,
    timestamp
  })

  generalEventLogItem.logEvent.nameValuePairs.nameValuePair.forEach((attribute) =>
    event.addAttribute(attribute.name, attribute.value)
  )

  return event
}
