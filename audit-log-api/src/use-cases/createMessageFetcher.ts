import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogDynamoGateway } from "shared-types"
import type MessageFetcher from "./MessageFetcher"
import FetchById from "./FetchById"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"
import FetchByStatus from "./FetchByStatus"
import FetchAll from "./FetchAll"

const createMessageFetcher = (event: APIGatewayProxyEvent, auditLogGateway: AuditLogDynamoGateway): MessageFetcher => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status
  const lastMessageId = event.queryStringParameters?.lastMessageId

  if (messageId) {
    return new FetchById(auditLogGateway, messageId)
  }

  if (externalCorrelationId) {
    return new FetchByExternalCorrelationId(auditLogGateway, externalCorrelationId)
  }

  if (status) {
    return new FetchByStatus(auditLogGateway, status, lastMessageId)
  }

  return new FetchAll(auditLogGateway, lastMessageId)
}

export default createMessageFetcher
