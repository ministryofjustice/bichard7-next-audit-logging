import "@bichard/testing-jest"
import { FakeAuditLogDynamoGateway } from "@bichard/testing-dynamodb"
import type { EventCategory } from "shared"
import { AuditLog, AuditLogEvent, BichardAuditLogEvent } from "shared"
import GetLastEventUseCase from "./GetLastEventUseCase"

const auditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const useCase = new GetLastEventUseCase(auditLogDynamoGateway)

const createAuditLog = (eventCategory: EventCategory): AuditLog => {
  const message = new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Xml")

  message.events = [
    new AuditLogEvent({
      category: "information",
      timestamp: new Date("2021-07-22T09:10:10"),
      eventType: "Dummy Event Type",
      eventSource: "Dummy Event Source"
    }),
    new BichardAuditLogEvent({
      category: eventCategory,
      timestamp: new Date("2021-07-22T12:10:10"),
      eventType: "Expected Event type",
      eventSource: "Expected Event Source",
      s3Path: "Expected S3 Path",
      eventSourceArn: "Expected Event Source ARN",
      eventSourceQueueName: "Expected Queue Name"
    }),
    new AuditLogEvent({
      category: "information",
      timestamp: new Date("2021-07-22T10:10:10"),
      eventType: "Dummy Event Type",
      eventSource: "Dummy Event Source"
    })
  ]

  return message
}

it("should return the last event when message exists and has events", async () => {
  const message = createAuditLog("error")

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toNotBeError()

  const event = result as BichardAuditLogEvent
  expect(event.s3Path).toBe("Expected S3 Path")
  expect(event.eventSourceArn).toBe("Expected Event Source ARN")
  expect(event.eventSourceQueueName).toBe("Expected Queue Name")
})

it("should return error when there are no events against the message", async () => {
  const message = createAuditLog("error")
  message.events = []

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toBeError(`No events found for message '${message.messageId}'`)
})

it("should return error when message does not exist", async () => {
  auditLogDynamoGateway.reset([])
  const result = await useCase.get("Dummy Message Id")

  expect(result).toBeError("No events found for message 'Dummy Message Id'")
})
