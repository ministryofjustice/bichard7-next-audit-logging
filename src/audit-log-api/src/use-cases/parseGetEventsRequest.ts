import type { APIGatewayProxyEvent } from "aws-lambda"
import type { Result, GetEventsProperties } from "shared-types"

const parseGetEventsRequest = (event: APIGatewayProxyEvent): Result<GetEventsProperties> => {
  const messageId = event.pathParameters?.messageId
  const largeObjects = event.queryStringParameters?.largeObjects

  if (!messageId) {
    return Error("Message Id must be provided in the URL.")
  }

  return { messageId, largeObjects }
}

export default parseGetEventsRequest
