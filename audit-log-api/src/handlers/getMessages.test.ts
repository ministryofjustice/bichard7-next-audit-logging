process.env.AWS_URL = "dummy"
process.env.AWS_REGION = "dummy"
process.env.AUDIT_LOG_TABLE_NAME = "dummy"

import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLog, HttpStatusCode } from "shared"
import FetchMessagesUseCase from "src/use-cases/FetchMessagesUseCase"
import getMessages from "./getMessages"

const createEvent = (messageId?: string): APIGatewayProxyEvent => {
  return <APIGatewayProxyEvent>JSON.parse(
    JSON.stringify({
      pathParameters: {
        messageId
      }
    })
  )
}

const log1 = new AuditLog("1", new Date(2021, 10, 12), "XML")
log1.caseId = "123"

const log2 = new AuditLog("2", new Date(2021, 10, 13), "XML")
log2.caseId = "456"

test("should respond with a list of messages", async () => {
  jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue([log1, log2])

  const event = createEvent()
  const messages = await getMessages(event)
  const actualResponse = <APIGatewayProxyResult>messages

  expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

  const actualMessages: AuditLog[] = JSON.parse(actualResponse.body)
  expect(actualMessages).toHaveLength(2)

  const actualMessage1 = actualMessages[0]
  expect(actualMessage1.messageId).toBe(log1.messageId)
  expect(actualMessage1.externalCorrelationId).toBe(log1.externalCorrelationId)
  expect(actualMessage1.caseId).toBe(log1.caseId)
  expect(actualMessage1.receivedDate).toBe(log1.receivedDate)
  expect(actualMessage1.messageXml).toBe(log1.messageXml)

  const actualMessage2 = actualMessages[1]
  expect(actualMessage2.messageId).toBe(log2.messageId)
  expect(actualMessage2.externalCorrelationId).toBe(log2.externalCorrelationId)
  expect(actualMessage2.caseId).toBe(log2.caseId)
  expect(actualMessage2.receivedDate).toBe(log2.receivedDate)
  expect(actualMessage2.messageXml).toBe(log2.messageXml)
})

test("should respond with error", async () => {
  const error = new Error("Expected Error")
  jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(error)

  const event = createEvent()
  const messages = await getMessages(event)
  const actualResponse = <APIGatewayProxyResult>messages

  expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
  expect(actualResponse.body).toEqual("Error: Expected Error")
})

test("should return a single message when the message Id is given", async () => {
  jest.spyOn(FetchMessagesUseCase.prototype, "getById").mockResolvedValue(log1)

  const event = createEvent("SomeMessageId")
  const messages = await getMessages(event)

  const actualResponse = <APIGatewayProxyResult>messages
  expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

  const actualMessages: AuditLog[] = JSON.parse(actualResponse.body)
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(1)

  const actualMessage = actualMessages[0]
  expect(actualMessage.messageId).toBe(log1.messageId)
  expect(actualMessage.externalCorrelationId).toBe(log1.externalCorrelationId)
  expect(actualMessage.caseId).toBe(log1.caseId)
  expect(actualMessage.receivedDate).toBe(log1.receivedDate)
  expect(actualMessage.messageXml).toBe(log1.messageXml)
})
