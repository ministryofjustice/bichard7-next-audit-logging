import type { APIGatewayProxyEvent } from "aws-lambda"
import type { AuditLog, Result } from "shared-types"
import { isError } from "shared-types"

export default function parseCreateAuditLogRequest(event: APIGatewayProxyEvent): Result<AuditLog> {
  const { body } = event

  if (!body) {
    return Error("Body cannot be empty.")
  }

  try {
    return <AuditLog>JSON.parse(body)
  } catch (error) {
    return isError(error) ? error : Error("Error parsing JSON")
  }
}
