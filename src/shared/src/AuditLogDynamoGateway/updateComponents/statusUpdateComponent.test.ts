import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"
import { AuditLogStatus } from "shared-types"
import status from "./statusUpdateComponent"

const auditLogEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

const processingCompleteEvent = (): AuditLogEvent => {
  return {
    eventType: EventType.PncUpdated,
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("statusUpdateComponent", () => {
  it("should change the status to complete when an event should cause the status to be changed", () => {
    const events = [auditLogEvent(), auditLogEvent(), processingCompleteEvent()]
    const forceOwnerDynamoUpdates = status([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#status = :status",
      updateExpressionValues: { ":status": AuditLogStatus.completed },
      expressionAttributeNames: { "#status": "status" }
    })
  })

  it("shouldn't set the status as processing in dynamodb when the message isn't complete", () => {
    const events = [auditLogEvent(), auditLogEvent(), auditLogEvent()]
    const forceOwnerDynamoUpdates = status([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#status = :status",
      updateExpressionValues: { ":status": AuditLogStatus.processing },
      expressionAttributeNames: { "#status": "status" }
    })
  })
})
