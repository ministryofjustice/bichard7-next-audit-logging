import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import getForceOwner from "./getForceOwner"

it("should return the force owner when message type is correct", () => {
  const event = {
    eventCode: EventCode.HearingOutcomeDetails,
    attributes: {
      "Force Owner": "010000"
    }
  } as unknown as AuditLogEvent

  const result = getForceOwner(event)

  expect(result).toBe(1)
})

it("should return the force owner for the correct V2 message type", () => {
  const event = {
    eventCode: EventCode.HearingOutcomeDetails,
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
