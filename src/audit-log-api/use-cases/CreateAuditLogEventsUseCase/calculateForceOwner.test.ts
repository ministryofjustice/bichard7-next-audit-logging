import type { DynamoAuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import calculateForceOwner from "./calculateForceOwner"

const forceOwnerChangeEvent = (): DynamoAuditLogEvent => {
  return {
    eventCode: EventCode.HearingOutcomeDetails,
    attributes: {
      "Force Owner": "010000"
    },
    timestamp: Date.now()
  } as unknown as DynamoAuditLogEvent
}

const nonForceOwnerChangeEvent = (): DynamoAuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {},
    timestamp: Date.now()
  } as unknown as DynamoAuditLogEvent
}

describe("calculateForceOwner", () => {
  it("should give the correct force owner when it changes", () => {
    const events = [
      nonForceOwnerChangeEvent(),
      nonForceOwnerChangeEvent(),
      forceOwnerChangeEvent(),
      nonForceOwnerChangeEvent()
    ]
    const forceOwner = calculateForceOwner(events)
    expect(forceOwner).toStrictEqual({ forceOwner: 1 })
  })

  it("shouldn't change anything in dynamodb when the force owner doesn't change", () => {
    const events = [nonForceOwnerChangeEvent(), nonForceOwnerChangeEvent(), nonForceOwnerChangeEvent()]
    const forceOwner = calculateForceOwner(events)
    expect(forceOwner).toStrictEqual({})
  })
})
