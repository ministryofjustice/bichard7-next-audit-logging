import type { AuditLogEvent } from "../types"
import shouldLogForAutomationReport, { automationReportEventTypes } from "./shouldLogForAutomationReport"

const automationReportEvents = automationReportEventTypes.map((eventType) => ({ eventType } as AuditLogEvent))

it.each(automationReportEvents)(
  "should return true when event type is an automation report event type: %s",
  (event) => {
    const result = shouldLogForAutomationReport(event)

    expect(result).toBe(true)
  }
)

it("should return false when event type is not one of the automation report event types", () => {
  const event = {
    eventType: "Invalid event type for automation report"
  } as AuditLogEvent

  const result = shouldLogForAutomationReport(event)

  expect(result).toBe(false)
})
