import { APIGatewayProxyEvent } from "aws-lambda"
import { PromiseResult, AuditLog } from "shared"
import FetchMessagesUseCase from "./FetchMessagesUseCase"

interface ParseGetMessagesRequestResult {
  fetchMessages: () => PromiseResult<AuditLog | AuditLog[] | null>
}

const parseGetMessagesRequest = (
  event: APIGatewayProxyEvent,
  fetchMessages: FetchMessagesUseCase
): ParseGetMessagesRequestResult => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status
  let fetchMessagesAction: () => PromiseResult<AuditLog | AuditLog[] | null>

  if (messageId) {
    fetchMessagesAction = () => fetchMessages.getById(messageId)
  } else if (externalCorrelationId) {
    fetchMessagesAction = () => fetchMessages.getByExternalCorrelationId(externalCorrelationId)
  } else if (status) {
    fetchMessagesAction = () => fetchMessages.getByStatus(status)
  } else {
    fetchMessagesAction = () => fetchMessages.get()
  }

  return { fetchMessages: fetchMessagesAction }
}

export default parseGetMessagesRequest
