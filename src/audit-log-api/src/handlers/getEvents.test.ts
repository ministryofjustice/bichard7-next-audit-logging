jest.mock("../use-cases/parseGetEventsRequest")

import "../testConfig"
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLog, AuditLogEvent } from "shared-types"
import { HttpStatusCode } from "shared"
import { FetchEventsUseCase, parseGetEventsRequest } from "../use-cases"
import getEvents from "./getEvents"

const createProxyEvent = (messageId?: string): APIGatewayProxyEvent => {
  return <APIGatewayProxyEvent>JSON.parse(
    JSON.stringify({
      pathParameters: {
        messageId
      }
    })
  )
}

const createAuditLogEvent = (timestamp: Date, eventType: string): AuditLogEvent =>
  new AuditLogEvent({
    category: "information",
    timestamp,
    eventType,
    eventSource: "Test"
  })

const log = new AuditLog("1", new Date(2021, 10, 12), "Dummy hash")
log.events = [
  createAuditLogEvent(new Date("2021-06-20T10:12:13"), "Event 1"),
  createAuditLogEvent(new Date("2021-06-15T10:12:13"), "Event 2"),
  createAuditLogEvent(new Date("2021-06-10T10:12:13"), "Event 3")
]

test("should respond with a list of events when message id exists and message has events", async () => {
  jest.spyOn(FetchEventsUseCase.prototype, "get").mockResolvedValue(log.events)
  const mockParseGetEventsRequest = parseGetEventsRequest as jest.MockedFunction<typeof parseGetEventsRequest>
  mockParseGetEventsRequest.mockReturnValue({ messageId: "Message Id" })

  const proxyEvent = createProxyEvent("Message Id")
  const response = await getEvents(proxyEvent)
  const actualResponse = <APIGatewayProxyResult>response

  expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

  const actualEvents: AuditLogEvent[] = JSON.parse(actualResponse.body)
  expect(actualEvents).toHaveLength(3)
  expect(actualEvents[0].eventType).toBe("Event 1")
  expect(actualEvents[1].eventType).toBe("Event 2")
  expect(actualEvents[2].eventType).toBe("Event 3")
})

test("should respond with bad request status when there is a validation error", async () => {
  const error = new Error("Test Error")
  const mockParseGetEventsRequest = parseGetEventsRequest as jest.MockedFunction<typeof parseGetEventsRequest>
  mockParseGetEventsRequest.mockReturnValue(error)

  const proxyEvent = createProxyEvent()
  const response = await getEvents(proxyEvent)
  const actualResponse = <APIGatewayProxyResult>response

  expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
  expect(actualResponse.body).toBe(`Error: ${error.message}`)
})

test("should respond with internal server error status when there is an error with fetching events", async () => {
  const error = new Error("Test Error")
  const mockParseGetEventsRequest = parseGetEventsRequest as jest.MockedFunction<typeof parseGetEventsRequest>
  mockParseGetEventsRequest.mockReturnValue({ messageId: "Message Id" })
  jest.spyOn(FetchEventsUseCase.prototype, "get").mockResolvedValue(error)

  const proxyEvent = createProxyEvent()
  const response = await getEvents(proxyEvent)
  const actualResponse = <APIGatewayProxyResult>response

  expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
  expect(actualResponse.body).toBe(`Error: ${error.message}`)
})
