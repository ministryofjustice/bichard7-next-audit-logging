import type { AuditLogEvent } from "shared-types"
import shouldLogForTopExceptionsReport from "./shouldLogForTopExceptionsReport"

it("should return true when event has correct event code attribute", () => {
  const event = {
    attributes: {
      eventCode: "exceptions.generated",
      "Error 1 Details": "Dummy"
    }
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(true)
})

it("should return false when event has incorrect event code attribute", () => {
  const event = {
    attributes: {
      eventCode: "dummy"
    }
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(false)
})
