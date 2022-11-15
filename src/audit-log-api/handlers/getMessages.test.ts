jest.mock("../use-cases/createMessageFetcher")

import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventPathParameters,
  APIGatewayProxyEventQueryStringParameters,
  APIGatewayProxyResult
} from "aws-lambda"
import { HttpStatusCode } from "src/shared"
import { mockDynamoAuditLog } from "src/shared/testing"
import type { DynamoAuditLog, OutputApiAuditLog, Result } from "src/shared/types"
import "../testConfig"
import { createMessageFetcher } from "../use-cases"
import LookupMessageValuesUseCase from "../use-cases/LookupMessageValuesUseCase"
import type MessageFetcher from "../use-cases/MessageFetcher"
import getMessages from "./getMessages"

const mockCreateMessageFetcher = createMessageFetcher as jest.MockedFunction<typeof createMessageFetcher>

const createDummyMessageFetcher = (returnValue: Result<DynamoAuditLog | DynamoAuditLog[] | null>): MessageFetcher => ({
  fetch: () => Promise.resolve(returnValue)
})

const createEvent = (
  pathParameters?: APIGatewayProxyEventPathParameters,
  queryStringParameters?: APIGatewayProxyEventQueryStringParameters
): APIGatewayProxyEvent => {
  return <APIGatewayProxyEvent>JSON.parse(
    JSON.stringify({
      pathParameters: pathParameters || {},
      queryStringParameters: queryStringParameters || {}
    })
  )
}

const log1 = mockDynamoAuditLog({
  externalCorrelationId: "1",
  receivedDate: new Date(2021, 10, 12).toISOString(),
  messageHash: "Dummy hash 1"
})
log1.caseId = "123"

const log2 = mockDynamoAuditLog({
  externalCorrelationId: "2",
  receivedDate: new Date(2021, 10, 13).toISOString(),
  messageHash: "Dummy hash 2"
})

log2.caseId = "456"

beforeEach(() => {
  jest.resetAllMocks()
})

test("should respond with a list of messages", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher([log1, log2]))

  const event = createEvent()
  const messages = await getMessages(event)
  const actualResponse = <APIGatewayProxyResult>messages

  expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

  const actualMessages: OutputApiAuditLog[] = JSON.parse(actualResponse.body)
  expect(actualMessages).toHaveLength(2)

  const actualMessage1 = actualMessages[0]
  expect(actualMessage1.messageId).toBe(log1.messageId)
  expect(actualMessage1.externalCorrelationId).toBe(log1.externalCorrelationId)
  expect(actualMessage1.caseId).toBe(log1.caseId)
  expect(actualMessage1.receivedDate).toBe(log1.receivedDate)

  const actualMessage2 = actualMessages[1]
  expect(actualMessage2.messageId).toBe(log2.messageId)
  expect(actualMessage2.externalCorrelationId).toBe(log2.externalCorrelationId)
  expect(actualMessage2.caseId).toBe(log2.caseId)
  expect(actualMessage2.receivedDate).toBe(log2.receivedDate)
})

test("should respond with error when message fetcher fails", async () => {
  const error = new Error("Expected Error")
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(error))

  const event = createEvent()
  const messages = await getMessages(event)
  const actualResponse = <APIGatewayProxyResult>messages

  expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
  expect(actualResponse.body).toBe("Error: Expected Error")
})

test("should respond with error when lookup message values fails", async () => {
  const error = new Error("Expected Error")
  const lookupMessageValuesUseCaseSpy = jest
    .spyOn(LookupMessageValuesUseCase.prototype, "execute")
    .mockResolvedValue(error)
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(log1))

  const event = createEvent({ messageId: "SomeMessageId" })
  const messages = await getMessages(event)
  const actualResponse = <APIGatewayProxyResult>messages

  expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
  expect(actualResponse.body).toBe("Error: Expected Error")
  lookupMessageValuesUseCaseSpy.mockRestore()
})

test("should return a single message when the message Id is given", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(log1))

  const event = createEvent({ messageId: "SomeMessageId" })
  const messages = await getMessages(event)

  const actualResponse = <APIGatewayProxyResult>messages
  expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

  const actualMessages: OutputApiAuditLog[] = JSON.parse(actualResponse.body)
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(1)

  const actualMessage = actualMessages[0]
  expect(actualMessage.messageId).toBe(log1.messageId)
  expect(actualMessage.externalCorrelationId).toBe(log1.externalCorrelationId)
  expect(actualMessage.caseId).toBe(log1.caseId)
  expect(actualMessage.receivedDate).toBe(log1.receivedDate)
})

test("should return an empty array when externalCorrelationId is specified and no messages are found", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(null))

  const event = createEvent(undefined, { externalCorrelationId: "SomeExternalCorrelationId" })
  const messages = await getMessages(event)

  const actualResponse = <APIGatewayProxyResult>messages
  expect(actualResponse.statusCode).toBe(HttpStatusCode.notFound)

  const actualMessages: OutputApiAuditLog[] = JSON.parse(actualResponse.body)
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(0)
})

test("should return a single message when the externalCorrelationId is given and a match is found", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(log1))

  const event = createEvent(undefined, { externalCorrelationId: "SomeExternalCorrelationId" })
  const messages = await getMessages(event)

  const actualResponse = <APIGatewayProxyResult>messages
  expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

  const actualMessages: OutputApiAuditLog[] = JSON.parse(actualResponse.body)
  expect(actualMessages).toBeDefined()
  expect(actualMessages).toHaveLength(1)

  const actualMessage = actualMessages[0]
  expect(actualMessage.messageId).toBe(log1.messageId)
  expect(actualMessage.externalCorrelationId).toBe(log1.externalCorrelationId)
  expect(actualMessage.caseId).toBe(log1.caseId)
  expect(actualMessage.receivedDate).toBe(log1.receivedDate)
})

test("should look up message values if fetchLargeMessages param is true", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(log1))
  const lookupMessageValuesUseCaseSpy = jest.spyOn(LookupMessageValuesUseCase.prototype, "execute")

  const event = createEvent(undefined, { externalCorrelationId: "SomeExternalCorrelationId" })
  await getMessages(event)

  expect(lookupMessageValuesUseCaseSpy).toHaveBeenCalledTimes(1)
})

test("should look up message values if fetchLargeMessages param is undefined", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(log1))
  const lookupMessageValuesUseCaseSpy = jest.spyOn(LookupMessageValuesUseCase.prototype, "execute")

  const eventWithLargeObjectsParam = createEvent(undefined, {
    externalCorrelationId: "SomeExternalCorrelationId",
    largeObjects: "true"
  })
  await getMessages(eventWithLargeObjectsParam)

  expect(lookupMessageValuesUseCaseSpy).toHaveBeenCalledTimes(1)
})

test("should not look up message values if fetchLargeMessages param is false", async () => {
  mockCreateMessageFetcher.mockReturnValue(createDummyMessageFetcher(log1))
  const lookupMessageValuesUseCaseSpy = jest.spyOn(LookupMessageValuesUseCase.prototype, "execute")

  const event = createEvent(undefined, { externalCorrelationId: "SomeExternalCorrelationId", largeObjects: "false" })
  await getMessages(event)

  expect(lookupMessageValuesUseCaseSpy).toHaveBeenCalledTimes(0)
})
