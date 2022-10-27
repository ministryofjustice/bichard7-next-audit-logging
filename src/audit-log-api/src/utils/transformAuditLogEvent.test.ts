import type { AuditLogEventOptions } from "shared-types"
import { AuditLogEvent } from "shared-types"
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

  it("should mark the record as being for the automation report if required", () => {
    const event = createLogEvent({ eventCode: "exceptions.generated" })
    const result = transformAuditLogEvent(event)
    expect(result._automationReport).toBe(true)
  })

  it("should not mark the record as being for the automation report if not required", () => {
    const event = createLogEvent({ eventCode: "exeptions.not.generated" })
    const result = transformAuditLogEvent(event)
    expect(result._automationReport).toBe(false)
  })

  it("should mark the record as being for the top exception report if required", () => {
    const event = createLogEvent({ eventCode: "exceptions.generated" })
    const result = transformAuditLogEvent(event)
    expect(result._topExceptionsReport).toBe(true)
  })

  it("should not mark the record as being for the top exception report if not required", () => {
    const event = createLogEvent()
    const result = transformAuditLogEvent(event)
    expect(result._topExceptionsReport).toBe(false)
  })

  it("should not return a user if the user attribute is not set", () => {
    const event = createLogEvent()
    const result = transformAuditLogEvent(event)
    expect(result.user).toBeUndefined()
  })
})
