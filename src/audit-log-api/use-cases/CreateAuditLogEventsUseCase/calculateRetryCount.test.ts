import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"
import calculateRetryCount from "./calculateRetryCount"

const retryEvent = (): AuditLogEvent => {
  return {
    eventCode: EventCode.RetryingMessage,
    attributes: {}
  } as unknown as AuditLogEvent
}

const nonRetryEvent = (): AuditLogEvent => {
  return {
    eventType: "Something else",
    attributes: {}
  } as unknown as AuditLogEvent
}

describe("calculateRetryCount", () => {
  it("should set sanitised status when a retry event is added", () => {
    const events = [nonRetryEvent(), nonRetryEvent(), retryEvent(), nonRetryEvent()]
    const forceOwnerDynamoUpdates = calculateRetryCount(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({ retryCount: 1 })
  })

  it("should increase the count by the correct amount when many retry events are added", () => {
    const events = [nonRetryEvent(), nonRetryEvent(), retryEvent(), nonRetryEvent(), retryEvent(), retryEvent()]
    const forceOwnerDynamoUpdates = calculateRetryCount(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({ retryCount: 3 })
  })

  it("shouldn't change anything in dynamodb when there are no retry events", () => {
    const events = [nonRetryEvent(), nonRetryEvent(), nonRetryEvent()]
    const forceOwnerDynamoUpdates = calculateRetryCount(events)
    expect(forceOwnerDynamoUpdates).toStrictEqual({})
  })
})
