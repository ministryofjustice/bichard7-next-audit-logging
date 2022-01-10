import type { AuditLogEvent } from "shared-types"
import shouldLogForTopExceptionsReport from "./shouldLogForTopExceptionsReport"

it("should return true when event has correct message type and error details attribute", () => {
  const event = {
    attributes: {
      "Message Type": "SPIResults",
      "Error 1 Details": "Dummy"
    }
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(true)
})

it("should return true when event has correct message type but does not have error details attribute", () => {
  const event = {
    attributes: {
      "Message Type": "SPIResults"
    }
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(false)
})

it("should return true when event has error details attribute but message type is incorrect", () => {
  const event = {
    attributes: {
      "Message Type": "Incorrect Message Type",
      "Error 1 Details": "Dummy"
    }
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(false)
})

it("should return true when event has error details attribute but message type attribute does not exist", () => {
  const event = {
    attributes: {
      "Error 1 Details": "Dummy"
    }
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(false)
})

it("should return true when event has not error details attribute and message type attribute does not exist", () => {
  const event = {
    attributes: {}
  } as unknown as AuditLogEvent

  const result = shouldLogForTopExceptionsReport(event)

  expect(result).toBe(false)
})
