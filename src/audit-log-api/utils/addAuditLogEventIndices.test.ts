import type { AuditLogEventOptions } from "src/shared/types"
import { AuditLogEvent } from "src/shared/types"
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
    expect(result._automationReport).toBe(1)
  })

  it("should not mark the record as being for the automation report if not required", () => {
    const event = createLogEvent({ eventCode: "exeptions.not.generated" })
    const result = addAuditLogEventIndices(event)
    expect(result._automationReport).toBe(0)
  })

  it("should mark the record as being for the top exception report if required", () => {
    const event = createLogEvent({ eventCode: "exceptions.generated" })
    const result = addAuditLogEventIndices(event)
    expect(result._topExceptionsReport).toBe(1)
  })

  it("should not mark the record as being for the top exception report if not required", () => {
    const event = createLogEvent()
    const result = addAuditLogEventIndices(event)
    expect(result._topExceptionsReport).toBe(0)
  })
})
