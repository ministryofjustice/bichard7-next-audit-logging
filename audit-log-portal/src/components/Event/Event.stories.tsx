import Event from "./Event"

export default {
  title: "components/Event",
  component: Event
}

export const Information = () => (
  <Event
    event={{
      attributes: {},
      category: "information",
      eventSource: "Event Source",
      eventType: "Event Type",
      timestamp: new Date().toISOString()
    }}
  />
)

export const Warning = () => (
  <Event
    event={{
      attributes: {},
      category: "warning",
      eventSource: "Event Source",
      eventType: "Event Type",
      timestamp: new Date().toISOString()
    }}
  />
)

export const Error = () => (
  <Event
    event={{
      attributes: {},
      category: "error",
      eventSource: "Event Source",
      eventType: "Event Type",
      timestamp: new Date().toISOString()
    }}
  />
)
