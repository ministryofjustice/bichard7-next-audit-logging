import type { APIGatewayProxyEvent } from "aws-lambda"
import { isError } from "src/shared/types"
import parseRetryMessageRequest from "./parseRetryMessageRequest"

describe("parseRetryMessageRequest()", () => {
  it("should return messageId when messageId exists in the path", () => {
    const expectedMessageId = "Message Id 1"
    const proxyEvent = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: expectedMessageId
      }
    })
    const actualMessageId = parseRetryMessageRequest(proxyEvent)

    expect(isError(actualMessageId)).toBe(false)
    expect(actualMessageId).toBe(expectedMessageId)
  })

  it("should return error when messageId does not exist in the path", () => {
    const proxyEvent = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {}
    })
    const actualMessageId = parseRetryMessageRequest(proxyEvent)

    expect(isError(actualMessageId)).toBe(true)

    const error = <Error>actualMessageId
    expect(error.message).toBe("Message Id must be provided in the URL.")
  })
})
