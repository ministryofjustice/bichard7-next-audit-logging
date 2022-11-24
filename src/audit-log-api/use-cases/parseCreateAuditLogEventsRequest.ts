import type { APIGatewayProxyEvent } from "aws-lambda"
import type { ApiAuditLogEvent, Result } from "src/shared/types"
import { isError } from "src/shared/types"

export interface ParseCreateAuditLogEventsRequestResult {
  messageId: string
  auditLogEvents: ApiAuditLogEvent[]
}

export default function parseCreateAuditLogEventsRequest(
  event: APIGatewayProxyEvent
): Result<ParseCreateAuditLogEventsRequestResult> {
  const messageId = event.pathParameters?.messageId
  const { body } = event

  try {
    if (!messageId) {
      return Error("Message Id must be provided in the URL.")
    }

    if (!body) {
      return Error("Body cannot be empty.")
    }
    const parsedBody = JSON.parse(body)

    return {
      messageId,
      auditLogEvents: Array.isArray(parsedBody) ? parsedBody : [parsedBody]
    }
  } catch (error) {
    return isError(error) ? error : Error("Error parsing JSON")
  }
}
