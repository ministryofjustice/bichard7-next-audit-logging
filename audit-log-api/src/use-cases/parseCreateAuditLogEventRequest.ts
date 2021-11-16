import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLogEvent, Result } from "shared"

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
    if (!body) {
      return Error("Body cannot be empty.")
    }

    if (!messageId) {
      return {
        messageId: "",
        auditLogEvent: <AuditLogEvent>JSON.parse(body)
      }
    }

    return {
      messageId,
      auditLogEvent: <AuditLogEvent>JSON.parse(body)
    }
  } catch (error) {
    return error
  }
}
