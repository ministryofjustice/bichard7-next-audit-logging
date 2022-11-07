import type { APIGatewayProxyEvent } from "aws-lambda"
import type { GetEventsProperties, Result } from "src/shared/types"
import shouldFetchLargeObjects from "../utils/shouldFetchLargeObjects"

const parseGetEventsRequest = (event: APIGatewayProxyEvent): Result<GetEventsProperties> => {
  const messageId = event.pathParameters?.messageId
  const fetchLargeObjects = shouldFetchLargeObjects(event.queryStringParameters?.largeObjects)

  if (!messageId) {
    return Error("Message Id must be provided in the URL.")
  }

  return { messageId, fetchLargeObjects }
}

export default parseGetEventsRequest
