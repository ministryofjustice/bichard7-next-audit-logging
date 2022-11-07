import type { AuditLogEvent } from "src/shared/types"
import { AuditLogStatus, EventCode, PncStatus, TriggerStatus } from "src/shared/types"
import status from "./statusUpdateComponent"

const auditLogEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

const processingCompleteEvent = (): AuditLogEvent => {
  return {
    eventCode: EventCode.PncUpdated,
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("statusUpdateComponent", () => {
  it("should change the status to complete when an event should cause the status to be changed", () => {
    const events = [auditLogEvent(), auditLogEvent(), processingCompleteEvent()]
    const forceOwnerDynamoUpdates = status([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#status = :status, #pncStatus = :pncStatus, #triggerStatus = :triggerStatus",
      updateExpressionValues: {
        ":status": AuditLogStatus.completed,
        ":pncStatus": PncStatus.Updated,
        ":triggerStatus": TriggerStatus.NoTriggers
      },
      expressionAttributeNames: { "#status": "status", "#pncStatus": "pncStatus", "#triggerStatus": "triggerStatus" }
    })
  })

  it("shouldn't set the status as processing in dynamodb when the message isn't complete", () => {
    const events = [auditLogEvent(), auditLogEvent(), auditLogEvent()]
    const forceOwnerDynamoUpdates = status([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#status = :status, #pncStatus = :pncStatus, #triggerStatus = :triggerStatus",
      updateExpressionValues: {
        ":status": AuditLogStatus.processing,
        ":pncStatus": PncStatus.Processing,
        ":triggerStatus": TriggerStatus.NoTriggers
      },
      expressionAttributeNames: { "#status": "status", "#pncStatus": "pncStatus", "#triggerStatus": "triggerStatus" }
    })
  })
})
