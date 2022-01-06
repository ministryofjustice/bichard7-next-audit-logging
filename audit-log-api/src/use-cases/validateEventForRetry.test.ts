import "shared-testing"
import type { EventCategory } from "shared"
import { BichardAuditLogEvent } from "shared"
import validateEventForRetry from "./validateEventForRetry"

const createAuditLogEvent = (category: EventCategory, s3Path?: string, eventSourceQueueName?: string) => {
  return new BichardAuditLogEvent({
    category,
    timestamp: new Date("2021-07-22T12:10:10"),
    eventType: "Expected Event type",
    eventSource: "Expected Event Source",
    s3Path: s3Path ?? "Expected S3 Path",
    eventSourceArn: "Expected Event Source ARN",
    eventSourceQueueName: eventSourceQueueName ?? "Expected Queue Name"
  })
}

it("should return error when event category is not error", () => {
  const event = createAuditLogEvent("information")

  const result = validateEventForRetry(event)

  expect(result).toBeError("This message has not failed and cannot be retried")
})

it("should return error when event does not have S3 path and queue name", () => {
  const event = createAuditLogEvent("error", "", "")

  const result = validateEventForRetry(event)

  expect(result).toBeError("Failed to retrieve the source event, so unable to retry")
})
