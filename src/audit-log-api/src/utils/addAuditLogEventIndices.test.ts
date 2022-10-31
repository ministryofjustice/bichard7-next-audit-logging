import type { AuditLogEventOptions } from "shared-types"
import { AuditLogEvent } from "shared-types"
import addAuditLogEventIndices from "./addAuditLogEventIndices"

const createLogEvent = (options: Partial<AuditLogEventOptions> = {}): AuditLogEvent => {
  return new AuditLogEvent({
    eventSource: "Test",
    category: "information",
    eventType: "Test Event",
    timestamp: new Date(),
    ...options
  })
}

describe("addAuditLogEventIndices", () => {
  it("should mark the record as being for the automation report if required", () => {
    const event = createLogEvent({ eventCode: "exceptions.generated" })
    const result = addAuditLogEventIndices(event)
    expect(result._automationReport).toBe(true)
  })

  it("should not mark the record as being for the automation report if not required", () => {
    const event = createLogEvent({ eventCode: "exeptions.not.generated" })
    const result = addAuditLogEventIndices(event)
    expect(result._automationReport).toBe(false)
  })

  it("should mark the record as being for the top exception report if required", () => {
    const event = createLogEvent({ eventCode: "exceptions.generated" })
    const result = addAuditLogEventIndices(event)
    expect(result._topExceptionsReport).toBe(true)
  })

  it("should not mark the record as being for the top exception report if not required", () => {
    const event = createLogEvent()
    const result = addAuditLogEventIndices(event)
    expect(result._topExceptionsReport).toBe(false)
  })
})
