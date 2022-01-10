import type { APIGatewayProxyEvent } from "aws-lambda"
import type { Result } from "shared-types"

const parseRetryMessageRequest = (event: APIGatewayProxyEvent): Result<string> => {
  const messageId = event.pathParameters?.messageId

  if (!messageId) {
    return Error("Message Id must be provided in the URL.")
  }

  return messageId
}

export default parseRetryMessageRequest
