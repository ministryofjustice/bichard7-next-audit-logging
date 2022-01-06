import { FakeAuditLogDynamoGateway } from "shared-testing"
import type { EventCategory, BichardAuditLogEvent } from "shared"
import { AuditLog, AuditLogEvent } from "shared"
import GetLastFailedMessageEventUseCase from "./GetLastEventUseCase"

const auditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const useCase = new GetLastFailedMessageEventUseCase(auditLogDynamoGateway)

const createAuditLog = (): AuditLog => new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Xml")
const createEvent = (date: string, category: EventCategory): AuditLogEvent => {
  return new AuditLogEvent({
    category,
    timestamp: new Date(date),
    eventType: "Dummy Event Type",
    eventSource: "Dummy Event Source"
  })
}
const createBichardEvent = (date: string, category: EventCategory): BichardAuditLogEvent => {
  const event = createEvent(date, category)

  return {
    ...event,
    s3Path: "Expected S3 Path",
    eventSourceArn: "Expected Event Source ARN",
    eventSourceQueueName: "Expected Queue Name"
  } as BichardAuditLogEvent
}

it("should return the last event when message exists and has events", async () => {
  const message = createAuditLog()
  message.events.push(createEvent("2021-07-22T09:10:10", "information"))
  message.events.push(createBichardEvent("2021-07-22T12:10:10", "error"))
  message.events.push(createEvent("2021-07-22T10:10:10", "information"))

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toNotBeError()

  const event = result as BichardAuditLogEvent
  expect(event.s3Path).toBe("Expected S3 Path")
  expect(event.eventSourceArn).toBe("Expected Event Source ARN")
  expect(event.eventSourceQueueName).toBe("Expected Queue Name")
})

it("should return error when there are no events against the message", async () => {
  const message = createAuditLog()

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toBeError(`No events found for message '${message.messageId}'`)
})

it("should return error when message does not exist", async () => {
  auditLogDynamoGateway.reset([])
  const result = await useCase.get("Dummy Message Id")

  expect(result).toBeError("No events found for message 'Dummy Message Id'")
})
