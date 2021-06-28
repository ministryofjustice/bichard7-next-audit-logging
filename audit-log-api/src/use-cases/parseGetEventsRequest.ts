import { APIGatewayProxyEvent } from "aws-lambda"
import { Result } from "shared"

const parseGetEventsRequest = (event: APIGatewayProxyEvent): Result<string> => {
  const messageId = event.pathParameters?.messageId

  if (!messageId) {
    return Error("Message Id must be provided in the URL.")
  }

  return messageId
}

export default parseGetEventsRequest
