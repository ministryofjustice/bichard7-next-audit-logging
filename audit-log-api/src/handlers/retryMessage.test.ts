jest.mock("src/use-cases/parseRetryMessageRequest")

import "src/testConfig"
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { parseRetryMessageRequest, RetryMessageUseCase } from "src/use-cases"
import { HttpStatusCode } from "shared"
import retryMessage from "./retryMessage"

describe("retryMessage", () => {
  it("should return Ok status when message has been retried successfully", async () => {
    const mockParseRetryMessageRequest = parseRetryMessageRequest as jest.MockedFunction<
      typeof parseRetryMessageRequest
    >
    mockParseRetryMessageRequest.mockReturnValue("Message Id")
    jest.spyOn(RetryMessageUseCase.prototype, "retry").mockResolvedValue()

    const proxyEvent = <APIGatewayProxyEvent>{}
    const response = await retryMessage(proxyEvent)
    const actualResponse = <APIGatewayProxyResult>response

    expect(actualResponse.statusCode).toBe(HttpStatusCode.ok)
    expect(actualResponse.body).toEqual("")
  })

  it("should return error response when message id does not exist in the URL", async () => {
    const error = new Error("Test Error")
    const mockParseRetryMessageRequest = parseRetryMessageRequest as jest.MockedFunction<
      typeof parseRetryMessageRequest
    >
    mockParseRetryMessageRequest.mockReturnValue(error)

    const proxyEvent = <APIGatewayProxyEvent>{}
    const response = await retryMessage(proxyEvent)
    const actualResponse = <APIGatewayProxyResult>response

    expect(actualResponse.statusCode).toBe(HttpStatusCode.badRequest)
    expect(actualResponse.body).toEqual(`Error: ${error.message}`)
  })

  it("should return error response when there is an error while retrying message", async () => {
    const error = new Error("Test Error")
    const mockParseRetryMessageRequest = parseRetryMessageRequest as jest.MockedFunction<
      typeof parseRetryMessageRequest
    >
    mockParseRetryMessageRequest.mockReturnValue("Message Id")
    jest.spyOn(RetryMessageUseCase.prototype, "retry").mockResolvedValue(error)

    const proxyEvent = <APIGatewayProxyEvent>{}
    const response = await retryMessage(proxyEvent)
    const actualResponse = <APIGatewayProxyResult>response

    expect(actualResponse.statusCode).toBe(HttpStatusCode.internalServerError)
    expect(actualResponse.body).toEqual(`Error: ${error.message}`)
  })
})
