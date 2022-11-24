import { mockApiAuditLogEvent } from "src/shared/testing"
import { EventCode } from "src/shared/types"
import transformAuditLogEvent from "./transformAuditLogEvent"

describe("transformAuditLogEvent", () => {
  it("should move the event code out of the attributes", () => {
    const event = mockApiAuditLogEvent({ attributes: { eventCode: "test.event" } })
    const result = transformAuditLogEvent(event)
    expect(result.eventCode).toBe("test.event")
    expect(result.attributes?.eventCode).toBeUndefined()
  })

  it("should move the user out of the attributes (lowercase)", () => {
    const event = mockApiAuditLogEvent({ attributes: { user: "test user" } })
    const result = transformAuditLogEvent(event)
    expect(result.user).toBe("test user")
    expect(result.attributes?.user).toBeUndefined()
  })

  it("should move the user out of the attributes (uppercase)", () => {
    const event = mockApiAuditLogEvent({ attributes: { User: "test user" } })
    const result = transformAuditLogEvent(event)
    expect(result.user).toBe("test user")
    expect(result.attributes?.User).toBeUndefined()
  })

  it("should not return a user if the user attribute is not set", () => {
    const event = mockApiAuditLogEvent()
    const result = transformAuditLogEvent(event)
    expect(result.user).toBeUndefined()
  })

  it("should add the eventCode for a valid event", () => {
    const event = mockApiAuditLogEvent({ eventCode: undefined, eventType: "Trigger generated" })
    const result = transformAuditLogEvent(event)
    expect(result.eventCode).toBe(EventCode.TriggersGenerated)
  })
})
