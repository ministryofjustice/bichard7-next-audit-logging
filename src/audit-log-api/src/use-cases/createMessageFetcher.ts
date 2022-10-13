import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogDynamoGateway } from "shared-types"
import FetchAll from "./FetchAll"
import FetchAutomationReport from "./FetchAutomationReport"
import FetchByExternalCorrelationId from "./FetchByExternalCorrelationId"
import FetchById from "./FetchById"
import FetchByStatus from "./FetchByStatus"
import FetchTopExceptionsReport from "./FetchTopExceptionsReport"
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

  const projection = { includeColumns, excludeColumns }
  const pagination = { limit, lastMessageId }

  if (eventsFilter) {
    if (!start || !end) {
      return new Error("Start and end dates required for eventsFilter")
    }

    if (eventsFilter === "automationReport") {
      return new FetchAutomationReport(auditLogGateway, { start, end, ...pagination })
    } else if (eventsFilter === "topExceptionsReport") {
      return new FetchTopExceptionsReport(auditLogGateway, { start, end, ...pagination })
    }
    return new Error("Invalid value for 'eventsFilter' parameter")
  }

  if (onlyUnsanitised) {
    return new FetchUnsanitised(auditLogGateway, { ...pagination, ...projection })
  }

  if (messageId) {
    return new FetchById(auditLogGateway, messageId, projection)
  }

  if (externalCorrelationId) {
    return new FetchByExternalCorrelationId(auditLogGateway, externalCorrelationId, projection)
  }

  if (status) {
    return new FetchByStatus(auditLogGateway, status, { ...pagination, ...projection })
  }

  return new FetchAll(auditLogGateway, { ...pagination, ...projection })
}

export default createMessageFetcher
