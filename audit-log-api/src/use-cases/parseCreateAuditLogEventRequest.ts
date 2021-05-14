import { APIGatewayProxyEvent } from "aws-lambda"
import { AuditLogEvent, Result } from "shared"

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
      throw new Error("Message Id must be provided in the URL.")
    }

    if (!body) {
      throw Error("Body cannot be empty.")
    }

    return {
      messageId,
      auditLogEvent: <AuditLogEvent>JSON.parse(body)
    }
  } catch (error) {
    return error
  }
}
