import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import calculateErrorRecordArchivalDate from "./calculateErrorRecordArchivalDate"

const archivalTime = Date.now()

const archivalEvent = (): AuditLogEvent => {
  return {
    eventCode: EventCode.ErrorRecordArchived,
    attributes: {},
    timestamp: archivalTime
  } as unknown as AuditLogEvent
}

const nonArchivalEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("calculateErrorRecordArchivalDate", () => {
  it("should set archived status when an archival event is added", () => {
    const events = [nonArchivalEvent(), nonArchivalEvent(), archivalEvent(), nonArchivalEvent()]
    const forceOwnerDynamoUpdates = calculateErrorRecordArchivalDate(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({ errorRecordArchivalDate: archivalTime })
  })

  it("shouldn't change anything in dynamodb when there are no archival events", () => {
    const events = [nonArchivalEvent(), nonArchivalEvent(), nonArchivalEvent()]
    const forceOwnerDynamoUpdates = calculateErrorRecordArchivalDate(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
