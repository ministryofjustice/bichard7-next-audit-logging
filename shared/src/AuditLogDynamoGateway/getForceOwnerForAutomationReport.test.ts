import type { AuditLogEvent } from "src/types"
import getForceOwnerForAutomationReport from "./getForceOwnerForAutomationReport"

it("should return the force owner when message type is correct", () => {
  const event = {
    eventType: "Input message received",
    attributes: {
      "Force Owner": "Dummy"
    }
  } as unknown as AuditLogEvent

  const result = getForceOwnerForAutomationReport(event)

  expect(result).toBe("Dummy")
})

it("should return undefined when message type is incorrect", () => {
  const event = {
    eventType: "Incorrect message type",
    attributes: {
      "Force Owner": "Dummy"
    }
  } as unknown as AuditLogEvent

  const result = getForceOwnerForAutomationReport(event)

  expect(result).toBeUndefined()
})
