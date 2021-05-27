import { AuditLogEvent, EventCategory } from "shared"
import Events from "./Events"

export default {
  title: "components/Events",
  component: Events
}

const createEvent = (category: EventCategory): AuditLogEvent => ({
  attributes: {},
  category,
  eventSource: "Event Source",
  eventType: "Event Type",
  timestamp: new Date().toISOString()
})

export const NoEvents = () => <Events events={[]} />

export const OneEventOfEachType = () => (
  <Events events={[createEvent("warning"), createEvent("information"), createEvent("error")]} />
)
