import type { AuditLogEvent } from "shared-types"
import { EventCode } from "shared-types"
import forceOwner from "./forceOwnerUpdateComponent"

const forceOwnerChangeEvent = (): AuditLogEvent => {
  return {
    eventCode: EventCode.HearingOutcomeDetails,
    attributes: {
      "Force Owner": "010000"
    },
    timestamp: Date.now()
  } as unknown as AuditLogEvent
}

const nonForceOwnerChangeEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {},
    timestamp: Date.now()
  } as unknown as AuditLogEvent
}

describe("forceOwnerUpdateComponent", () => {
  it("should give the correct force owner when it changes", () => {
    const events = [
      nonForceOwnerChangeEvent(),
      nonForceOwnerChangeEvent(),
      forceOwnerChangeEvent(),
      nonForceOwnerChangeEvent()
    ]
    const forceOwnerDynamoUpdates = forceOwner([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "forceOwner = :forceOwner",
      updateExpressionValues: { ":forceOwner": 1 }
    })
  })

  it("shouldn't change anything in dynamodb when the force owner doesn't change", () => {
    const events = [nonForceOwnerChangeEvent(), nonForceOwnerChangeEvent(), nonForceOwnerChangeEvent()]
    const forceOwnerDynamoUpdates = forceOwner([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
