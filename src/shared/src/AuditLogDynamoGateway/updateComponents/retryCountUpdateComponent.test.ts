import type { AuditLogEvent } from "shared-types"
import { EventType } from "shared-types"
import retryCountUpdateComponent from "./retryCountUpdateComponent"

const retryEvent = (): AuditLogEvent => {
  return {
    eventType: EventType.Retrying,
    attributes: {}
  } as unknown as AuditLogEvent
}

const nonRetryEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("retryCountUpdateComponent", () => {
  it("should set sanitised status when a retry event is added", () => {
    const events = [nonRetryEvent(), nonRetryEvent(), retryEvent(), nonRetryEvent()]
    const forceOwnerDynamoUpdates = retryCountUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#retryCount = if_not_exists(#retryCount, :zero) + :retryCount",
      expressionAttributeNames: { "#retryCount": "retryCount" },
      updateExpressionValues: { ":retryCount": 1, ":zero": 0 }
    })
  })

  it("should increase the count by the correct amount when many retry events are added", () => {
    const events = [nonRetryEvent(), nonRetryEvent(), retryEvent(), nonRetryEvent(), retryEvent(), retryEvent()]
    const forceOwnerDynamoUpdates = retryCountUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({
      updateExpression: "#retryCount = if_not_exists(#retryCount, :zero) + :retryCount",
      expressionAttributeNames: { "#retryCount": "retryCount" },
      updateExpressionValues: { ":retryCount": 3, ":zero": 0 }
    })
  })

  it("shouldn't change anything in dynamodb when there are no retry events", () => {
    const events = [nonRetryEvent(), nonRetryEvent(), nonRetryEvent()]
    const forceOwnerDynamoUpdates = retryCountUpdateComponent([], events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
