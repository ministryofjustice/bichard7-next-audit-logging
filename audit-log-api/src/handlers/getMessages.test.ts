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

const expectedSuccessfulBodyResponse =
  '{"messages":[{"messageId":"1","receivedDate":"2021-11-12T00:00:00.000Z","messageXml":"XML","caseId":"123"},{"messageId":"2","receivedDate":"2021-11-13T00:00:00.000Z","messageXml":"XML","caseId":"456"}]}'

const expectedErrorBodyResponse = "Error: Call failed"

describe("getMessages()", () => {
  it("should respond with a list of messages", async () => {
    jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(expectedSuccessfulResponse)

    const messages = await getMessages()
    const actualResponse = <APIGatewayProxyResult>messages

    expect(actualResponse.statusCode).toBe(HttpStatusCode.Ok)
    expect(actualResponse.body).toEqual(expectedSuccessfulBodyResponse)
  })

  it("should respond with error", async () => {
    const error = new Error("Call failed")
    jest.spyOn(FetchMessagesUseCase.prototype, "get").mockResolvedValue(error)

    const messages = await getMessages()
    const actualResponse = <APIGatewayProxyResult>messages

    expect(actualResponse.statusCode).toBe(HttpStatusCode.InternalServerError)
    expect(actualResponse.body).toEqual(expectedErrorBodyResponse)
  })
})
