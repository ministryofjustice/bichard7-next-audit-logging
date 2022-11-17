import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import calculateIsSanitised from "./calculateIsSanitised"

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

describe("calculateIsSanitised", () => {
  it("should set sanitised status when a sanitisation is added", () => {
    const events = [nonSanitisationEvent(), nonSanitisationEvent(), sanitisationEvent(), nonSanitisationEvent()]
    const forceOwnerDynamoUpdates = calculateIsSanitised(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({ isSanitised: 1 })
  })

  it("shouldn't change anything in dynamodb when there are no sanitisation events", () => {
    const events = [nonSanitisationEvent(), nonSanitisationEvent(), nonSanitisationEvent()]
    const forceOwnerDynamoUpdates = calculateIsSanitised(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})