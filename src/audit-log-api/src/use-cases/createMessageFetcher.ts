import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogDynamoGateway } from "shared-types"
import FetchAll from "./FetchAll"
import FetchAutomationReport from "./FetchAutomationReport"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"
import FetchById from "./FetchById"
import FetchByStatus from "./FetchByStatus"
import FetchUnsanitised from "./FetchUnsanitised"
import type MessageFetcher from "./MessageFetcher"

const createMessageFetcher = (
  event: APIGatewayProxyEvent,
  auditLogGateway: AuditLogDynamoGateway
): MessageFetcher | Error => {
  const messageId = event.pathParameters?.messageId
  const externalCorrelationId = event.queryStringParameters?.externalCorrelationId
  const status = event.queryStringParameters?.status
  const lastMessageId = event.queryStringParameters?.lastMessageId
  const onlyUnsanitised = event.queryStringParameters?.unsanitised === "true"
  const limit = event.queryStringParameters?.limit ? Number(event.queryStringParameters.limit) : 10
  const eventsFilter = event.queryStringParameters?.eventsFilter
  const start = event.queryStringParameters?.start ? new Date(event.queryStringParameters.start) : undefined
  const end = event.queryStringParameters?.end ? new Date(event.queryStringParameters.end) : undefined

  const includeColumns = event.queryStringParameters?.includeColumns
    ? event.queryStringParameters.includeColumns.split(",")
    : []

  const excludeColumns = event.queryStringParameters?.excludeColumns
    ? event.queryStringParameters.excludeColumns.split(",")
    : []

  if (eventsFilter) {
    if (eventsFilter === "automationReport") {
      if (!start || !end) {
        return new Error("Start and end dates required for eventsFilter")
      }
      return new FetchAutomationReport(auditLogGateway, { start, end })
    }
    return new Error("Invalid value for 'eventsFilter' parameter")
  }

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

  return new FetchAll(auditLogGateway, { lastMessageId, includeColumns, excludeColumns })
}

export default createMessageFetcher
