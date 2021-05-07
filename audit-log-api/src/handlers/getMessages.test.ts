jest.mock("src/use-cases/FetchMessagesUseCase")

import { APIGatewayProxyResult } from "aws-lambda"
import { AuditLog, HttpStatusCode } from "shared"
import FetchMessagesUseCase from "src/use-cases/FetchMessagesUseCase"
import getMessages from "./getMessages"

const log1 = new AuditLog("1", new Date(2021, 10, 12), "XML")
log1.caseId = "123"

const log2 = new AuditLog("2", new Date(2021, 10, 13), "XML")
log2.caseId = "456"

const expectedSuccessfulResponse = [log1, log2]

describe("getMessages()", () => {
  it("should respond with a list of messages", async () => {
    jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(expectedSuccessfulResponse)

    const messages = await getMessages()
    const actualResponse = <APIGatewayProxyResult>messages

    expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)

    const actualMessages: AuditLog[] = JSON.parse(actualResponse.body).messages
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

  it("should respond with error", async () => {
    const error = new Error("Call failed")
    jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(error)

    const messages = await getMessages()
    const actualResponse = <APIGatewayProxyResult>messages

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toEqual("Error: Call failed")
  })
})
