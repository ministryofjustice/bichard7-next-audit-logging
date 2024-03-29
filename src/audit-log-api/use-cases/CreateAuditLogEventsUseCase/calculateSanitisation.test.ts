import type { DynamoAuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import calculateSanitisation from "./calculateSanitisation"

const sanitisationEvent = (): DynamoAuditLogEvent => {
  return {
    eventCode: EventCode.Sanitised,
    attributes: {}
  } as unknown as DynamoAuditLogEvent
}

const nonSanitisationEvent = (): DynamoAuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as DynamoAuditLogEvent
}

describe("calculateSanitisation", () => {
  it("should set sanitised status when a sanitisation is added", () => {
    const events = [nonSanitisationEvent(), nonSanitisationEvent(), sanitisationEvent(), nonSanitisationEvent()]
    const forceOwnerDynamoUpdates = calculateSanitisation(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({ isSanitised: 1, nextSanitiseCheck: undefined })
  })

  it("shouldn't change anything in dynamodb when there are no sanitisation events", () => {
    const events = [nonSanitisationEvent(), nonSanitisationEvent(), nonSanitisationEvent()]
    const forceOwnerDynamoUpdates = calculateSanitisation(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
