import AuditLogEvent from "types/AuditLogEvent"
import type EventCategory from "types/EventCategory"
import Events from "./Events"

export default {
  title: "components/Events",
  component: Events
}

const createEvent = (category: EventCategory): AuditLogEvent =>
  new AuditLogEvent({
    category,
    eventSource: "Event Source",
    eventType: "Event Type",
    timestamp: new Date()
  })

export const NoEvents = () => <Events events={[]} />

export const OneEventOfEachType = () => (
  <Events events={[createEvent("warning"), createEvent("information"), createEvent("error")]} />
)
