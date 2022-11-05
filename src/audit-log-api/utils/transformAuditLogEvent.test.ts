import type { AuditLogEventOptions } from "src/shared/types"
import { AuditLogEvent, EventCode } from "src/shared/types"
import transformAuditLogEvent from "./transformAuditLogEvent"

const createLogEvent = (options: Partial<AuditLogEventOptions> = {}): AuditLogEvent => {
  return new AuditLogEvent({
    eventSource: "Test",
    category: "information",
    eventType: "Test Event",
    timestamp: new Date(),
    ...options
  })
}

describe("transformAuditLogEvent", () => {
  it("should move the event code out of the attributes", () => {
    const event = createLogEvent({ attributes: { eventCode: "test.event" } })
    const result = transformAuditLogEvent(event)
    expect(result.eventCode).toBe("test.event")
    expect(result.attributes.eventCode).toBeUndefined()
  })

  it("should move the user out of the attributes (lowercase)", () => {
    const event = createLogEvent({ attributes: { user: "test user" } })
    const result = transformAuditLogEvent(event)
    expect(result.user).toBe("test user")
    expect(result.attributes.user).toBeUndefined()
  })

  it("should move the user out of the attributes (uppercase)", () => {
    const event = createLogEvent({ attributes: { User: "test user" } })
    const result = transformAuditLogEvent(event)
    expect(result.user).toBe("test user")
    expect(result.attributes.User).toBeUndefined()
  })

  it("should not return a user if the user attribute is not set", () => {
    const event = createLogEvent()
    const result = transformAuditLogEvent(event)
    expect(result.user).toBeUndefined()
  })

  it("should add the eventCode for a valid event", () => {
    const event = createLogEvent({ eventType: "Trigger generated" })
    const result = transformAuditLogEvent(event)
    expect(result.eventCode).toBe(EventCode.TriggersGenerated)
  })
})
