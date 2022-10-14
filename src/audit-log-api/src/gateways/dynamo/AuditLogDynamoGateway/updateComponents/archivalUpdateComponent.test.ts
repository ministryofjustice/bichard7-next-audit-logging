import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"
import archivalUpdateComponent from "./archivalUpdateComponent"

const archivalTime = Date.now()

const archivalEvent = (): AuditLogEvent => {
  return {
    eventType: EventType.ErrorRecordArchival,
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

describe("archivalUpdateComponent", () => {
  it("should set archived status when an archival event is added", () => {
    const events = [nonArchivalEvent(), nonArchivalEvent(), archivalEvent(), nonArchivalEvent()]
    const forceOwnerDynamoUpdates = archivalUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#errorRecordArchivalDate = :errorRecordArchivalDate",
      expressionAttributeNames: { "#errorRecordArchivalDate": "errorRecordArchivalDate" },
      updateExpressionValues: { ":errorRecordArchivalDate": archivalTime }
    })
  })

  it("shouldn't change anything in dynamodb when there are no archival events", () => {
    const events = [nonArchivalEvent(), nonArchivalEvent(), nonArchivalEvent()]
    const forceOwnerDynamoUpdates = archivalUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
