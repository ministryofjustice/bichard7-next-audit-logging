import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogEvent, Result } from "shared-types"
import { isError } from "shared-types"

export interface ParseCreateAuditLogEventRequestResult {
  messageId: string
  auditLogEvent: AuditLogEvent
}

export default function parseCreateAuditLogEventRequest(
  event: APIGatewayProxyEvent
): Result<ParseCreateAuditLogEventRequestResult> {
  const messageId = event.pathParameters?.messageId
  const { body } = event

  try {
    if (!messageId) {
      return Error("Message Id must be provided in the URL.")
    }

    if (!body) {
      return Error("Body cannot be empty.")
    }

    return {
      messageId,
      auditLogEvent: <AuditLogEvent>JSON.parse(body)
    }
  } catch (error) {
    return isError(error) ? error : Error("Error parsing JSON")
  }
}
