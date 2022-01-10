import { AuditLogEvent } from "shared-types"
import Event from "./Event"

export default {
  title: "components/Event",
  component: Event
}

export const Information = () => (
  <Event
    event={
      new AuditLogEvent({
        category: "information",
        eventSource: "Event Source",
        eventType: "Event Type",
        timestamp: new Date()
      })
    }
  />
)

export const Warning = () => (
  <Event
    event={
      new AuditLogEvent({
        category: "warning",
        eventSource: "Event Source",
        eventType: "Event Type",
        timestamp: new Date()
      })
    }
  />
)

export const Error = () => (
  <Event
    event={
      new AuditLogEvent({
        category: "error",
        eventSource: "Event Source",
        eventType: "Event Type",
        timestamp: new Date()
      })
    }
  />
)
