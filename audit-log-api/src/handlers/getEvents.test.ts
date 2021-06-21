process.env.AWS_URL = "dummy"
process.env.AWS_REGION = "dummy"
process.env.AUDIT_LOG_TABLE_NAME = "dummy"

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLog, AuditLogEvent, HttpStatusCode } from "shared"
import { FetchEventsUseCase } from "src/use-cases"
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

const log = new AuditLog("1", new Date(2021, 10, 12), "XML")
log.events = [
  new AuditLogEvent("information", new Date("2021-06-20T10:12:13"), "Event 1"),
  new AuditLogEvent("information", new Date("2021-06-15T10:12:13"), "Event 2"),
  new AuditLogEvent("information", new Date("2021-06-10T10:12:13"), "Event 3")
]

test("should respond with a list of messages", async () => {
  jest.spyOn(FetchEventsUseCase.prototype, "get").mockResolvedValue(log.events)

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

test("should respond with error", async () => {
  const error = new Error("Message Id must be provided in the URL.")
  jest.spyOn(FetchEventsUseCase.prototype, "get").mockResolvedValue(error)

  const proxyEvent = createProxyEvent()
  const response = await getEvents(proxyEvent)
  const actualResponse = <APIGatewayProxyResult>response

  expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
  expect(actualResponse.body).toEqual(`Error: ${error.message}`)
})
