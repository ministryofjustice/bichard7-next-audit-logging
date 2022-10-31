import type { AuditLogEvent } from "shared-types"
import { EventCode } from "shared-types"
import sanitisationUpdateComponent from "./sanitisationUpdateComponent"

const sanitisationEvent = (): AuditLogEvent => {
  return {
    eventCode: EventCode.Sanitised,
    attributes: {}
  } as unknown as AuditLogEvent
}

const nonSanitisationEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("sanitisationUpdateComponent", () => {
  it("should set sanitised status when a sanitisation is added", () => {
    const events = [nonSanitisationEvent(), nonSanitisationEvent(), sanitisationEvent(), nonSanitisationEvent()]
    const forceOwnerDynamoUpdates = sanitisationUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#isSanitised = :isSanitised",
      expressionAttributeNames: { "#isSanitised": "isSanitised" },
      updateExpressionValues: { ":isSanitised": 1 }
    })
  })

  it("shouldn't change anything in dynamodb when there are no sanitisation events", () => {
    const events = [nonSanitisationEvent(), nonSanitisationEvent(), nonSanitisationEvent()]
    const forceOwnerDynamoUpdates = sanitisationUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
