import "@bichard/testing-jest"
import { FakeAuditLogDynamoGateway } from "@bichard/testing-dynamodb"
import { AuditLog, AuditLogEvent, BichardAuditLogEvent, isError } from "shared"
import GetLastEventUseCase from "./GetLastEventUseCase"

const auditLogDynamoGateway = new FakeAuditLogDynamoGateway()
const useCase = new GetLastEventUseCase(auditLogDynamoGateway)

it("should return the last event when message exists and has events", async () => {
  const message = new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Xml")
  const expectedEvent = new BichardAuditLogEvent({
    category: "error",
    timestamp: new Date("2021-07-22T12:10:10"),
    eventType: "Expected Event type",
    eventSource: "Expected Event Source",
    s3Path: "Expected S3 Path",
    eventSourceArn: "Expected Event Source ARN",
    eventSourceQueueName: "Expected Queue Name"
  })

  message.events = [
    new AuditLogEvent({
      category: "information",
      timestamp: new Date("2021-07-22T09:10:10"),
      eventType: "Dummy Event Type",
      eventSource: "Dummy Event Source"
    }),
    expectedEvent,
    new AuditLogEvent({
      category: "information",
      timestamp: new Date("2021-07-22T10:10:10"),
      eventType: "Dummy Event Type",
      eventSource: "Dummy Event Source"
    })
  ]

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(result).toNotBeError()

  const event = result as BichardAuditLogEvent
  expect(event.s3Path).toBe(expectedEvent.s3Path)
  expect(event.eventSourceArn).toBe(expectedEvent.eventSourceArn)
  expect(event.eventSourceQueueName).toBe(expectedEvent.eventSourceQueueName)
})

it("should return error when last event category is not error", async () => {
  const message = new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Xml")
  message.events.push(
    new BichardAuditLogEvent({
      category: "information",
      timestamp: new Date("2021-07-22T12:10:10"),
      eventType: "Event type",
      eventSource: "Event Source",
      s3Path: "S3 Path",
      eventSourceArn: "Event Source ARN",
      eventSourceQueueName: "Queue Name"
    })
  )

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("This message has not failed and cannot be retried")
})

it("should return error when last event does not have S3 path and queue name", async () => {
  const message = new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Xml")
  message.events.push(
    new AuditLogEvent({
      category: "error",
      timestamp: new Date("2021-07-22T12:10:10"),
      eventType: "Event type",
      eventSource: "Event Source"
    })
  )

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("Both s3Path and eventSourceQueueName in the failed event must have values")
})

it("should return error when there are no events against the message", async () => {
  const message = new AuditLog("External Correlation Id", new Date("2021-07-22T08:10:10"), "Xml")

  auditLogDynamoGateway.reset([message])
  const result = await useCase.get(message.messageId)

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe(`No events found for message '${message.messageId}'`)
})

it("should return error when message does not exist", async () => {
  auditLogDynamoGateway.reset([])
  const result = await useCase.get("Dummy Message Id")

  expect(isError(result)).toBe(true)

  const error = <Error>result
  expect(error.message).toBe("No events found for message 'Dummy Message Id'")
})
