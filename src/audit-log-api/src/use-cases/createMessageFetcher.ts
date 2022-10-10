import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogDynamoGateway } from "shared-types"
import FetchAll from "./FetchAll"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"
import FetchById from "./FetchById"
import FetchByStatus from "./FetchByStatus"
import FetchUnsanitised from "./FetchUnsanitised"
import type MessageFetcher from "./MessageFetcher"

const createMessageFetcher = (event: APIGatewayProxyEvent, auditLogGateway: AuditLogDynamoGateway): MessageFetcher => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status
  const lastMessageId = event.queryStringParameters?.lastMessageId
  const onlyUnsanitised = event.queryStringParameters?.unsanitised === "true"
  const limit = event.queryStringParameters?.limit ? Number(event.queryStringParameters.limit) : 10

  if (onlyUnsanitised) {
    return new FetchUnsanitised(auditLogGateway, limit)
  }

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
