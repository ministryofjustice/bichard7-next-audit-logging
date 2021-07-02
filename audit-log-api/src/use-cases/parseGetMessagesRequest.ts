import { APIGatewayProxyEvent } from "aws-lambda"
import MessageFetcher from "src/types/MessageFetcher"
import { FetchAll, FetchByExternalCorrelationId, FetchById, FetchByStatus } from "src/utils/MessageFetchers"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

interface ParseGetMessagesRequestResult {
  messageFetcher: MessageFetcher
}

const parseGetMessagesRequest = (
  event: APIGatewayProxyEvent,
  fetchMessages: FetchMessagesUseCase
): ParseGetMessagesRequestResult => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status

  let messageFetcher: MessageFetcher

  if (messageId) {
    messageFetcher = new FetchById(fetchMessages, messageId)
  } else if (externalCorrelationId) {
    messageFetcher = new FetchByExternalCorrelationId(fetchMessages, externalCorrelationId)
  } else if (status) {
    messageFetcher = new FetchByStatus(fetchMessages, status)
  } else {
    messageFetcher = new FetchAll(fetchMessages)
  }

  return { messageFetcher }
}

export default parseGetMessagesRequest
