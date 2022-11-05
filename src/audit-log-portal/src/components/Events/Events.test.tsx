import { screen } from "@testing-library/react"
import { render } from "testing/render"
import type AuditLogEvent from "types/AuditLogEvent"
import type EventCategory from "types/EventCategory"
import Events from "./Events"

const createAuditLogEvent = (category: EventCategory, date: Date): AuditLogEvent =>
  ({
    attributes: {},
    category,
    eventSource: "UI Test",
    eventType: "Test Event",
    timestamp: date.toISOString()
  } as AuditLogEvent)

test("should render 'No Events' when no events are given", () => {
  render(<Events events={[]} />)

  const noEvents = screen.getByLabelText("No Events")
  const eventsContainer = screen.queryByLabelText("Events")

  expect(noEvents.innerHTML).toContain("No events")
  expect(eventsContainer).toBeNull()
})

test("should render 3 events with different icons when 3 events are given", () => {
  const events: AuditLogEvent[] = [
    createAuditLogEvent("information", new Date("2021-05-24")),
    createAuditLogEvent("warning", new Date("2021-05-25")),
    createAuditLogEvent("error", new Date("2021-05-26"))
  ]

  render(<Events events={events} />)

  expect(screen.queryByLabelText("No Events")).not.toBeInTheDocument()

  const actualEvents = screen.getByLabelText("Events")
  expect(actualEvents.children).toHaveLength(3)
})
