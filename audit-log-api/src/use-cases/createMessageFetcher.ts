import { APIGatewayProxyEvent } from "aws-lambda"
import MessageFetcher from "src/types/MessageFetcher"
import { FetchAll, FetchByExternalCorrelationId, FetchById, FetchByStatus } from "src/use-cases/MessageFetchers"
import { AuditLogDynamoGateway } from "shared"

const createMessageFetcher = (event: APIGatewayProxyEvent, auditLogGateway: AuditLogDynamoGateway): MessageFetcher => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status

  if (messageId) {
    return new FetchById(auditLogGateway, messageId)
  }
  if (externalCorrelationId) {
    return new FetchByExternalCorrelationId(auditLogGateway, externalCorrelationId)
  }
  if (status) {
    return new FetchByStatus(auditLogGateway, status)
  }
  return new FetchAll(auditLogGateway)
}

export default createMessageFetcher
