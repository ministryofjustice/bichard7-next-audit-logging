import { isError } from "shared"
import { APIGatewayProxyEvent } from "aws-lambda"
import parseGetEventsRequest from "./parseGetEventsRequest"

describe("parseGetEventsRequest()", () => {
  it("should return events of the message when messageId exists in the path", async () => {
    const expectedMessageId = "Message Id 1"
    const proxyEvent = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {
        messageId: expectedMessageId
      }
    })
    const actualMessageId = parseGetEventsRequest(proxyEvent)

    expect(isError(actualMessageId)).toBe(false)
    expect(actualMessageId).toBe(expectedMessageId)
  })

  it("should return error when messageId does not exist in the path", async () => {
    const proxyEvent = <APIGatewayProxyEvent>(<unknown>{
      pathParameters: {}
    })
    const actualMessageId = parseGetEventsRequest(proxyEvent)

    expect(isError(actualMessageId)).toBe(true)

    const error = <Error>actualMessageId
    expect(error.message).toBe("Message Id must be provided in the URL.")
  })
})
