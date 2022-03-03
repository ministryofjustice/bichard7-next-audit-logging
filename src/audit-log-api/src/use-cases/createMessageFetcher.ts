import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogDynamoGateway } from "shared-types"
import type MessageFetcher from "./MessageFetcher"
import FetchById from "./FetchById"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"
import FetchByStatus from "./FetchByStatus"
import FetchAll from "./FetchAll"
import FetchByHash from "./FetchByHash"

const createMessageFetcher = (event: APIGatewayProxyEvent, auditLogGateway: AuditLogDynamoGateway): MessageFetcher => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const hash = event.queryStringParameters?.hash
  const status = event.queryStringParameters?.status
  const lastMessageId = event.queryStringParameters?.lastMessageId

  if (messageId) {
    return new FetchById(auditLogGateway, messageId)
  }

  if (externalCorrelationId) {
    return new FetchByExternalCorrelationId(auditLogGateway, externalCorrelationId)
  }

  if (hash) {
    return new FetchByHash(auditLogGateway, hash)
  }

  if (status) {
    return new FetchByStatus(auditLogGateway, status, lastMessageId)
  }

  return new FetchAll(auditLogGateway, lastMessageId)
}

export default createMessageFetcher
