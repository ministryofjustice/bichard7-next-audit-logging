import { APIGatewayProxyEvent } from "aws-lambda"
import IMessageFetcher from "src/types/IMessageFetcher"
import { FetchAll, FetchByExternalCorrelationId, FetchById, FetchByStatus } from "src/utils/MessageFetchers"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

interface ParseGetMessagesRequestResult {
  messageFetcher: IMessageFetcher
}

const parseGetMessagesRequest = (
  event: APIGatewayProxyEvent,
  fetchMessages: FetchMessagesUseCase
): ParseGetMessagesRequestResult => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status

  let messageFetcher: IMessageFetcher

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
