import type { AuditLogEvent } from "shared-types"
import getForceOwner from "./getForceOwner"

it("should return the force owner when message type is correct", () => {
  const event = {
    eventType: "Input message received",
    attributes: {
      "Force Owner": "010000"
    }
  } as unknown as AuditLogEvent

  const result = getForceOwner(event)

  expect(result).toBe(1)
})

it("should return the force owner for the correct V2 message type", () => {
  const event = {
    eventType: "Hearing outcome details",
    attributes: {
      "Force Owner": "010000"
    }
  } as unknown as AuditLogEvent

  const result = getForceOwner(event)

  expect(result).toBe(1)
})

it("should return undefined when message type is incorrect", () => {
  const event = {
    eventType: "Incorrect message type",
    attributes: {
      "Force Owner": "010000"
    }
  } as unknown as AuditLogEvent

  const result = getForceOwner(event)

  expect(result).toBeUndefined()
})
