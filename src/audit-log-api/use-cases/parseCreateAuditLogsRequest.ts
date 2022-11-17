import type { APIGatewayProxyEvent } from "aws-lambda"
import type { InputApiAuditLog, Result } from "src/shared/types"
import { isError } from "src/shared/types"

export default function parseCreateAuditLogsRequest(event: APIGatewayProxyEvent): Result<InputApiAuditLog[]> {
  const { body } = event

  if (!body) {
    return Error("Body cannot be empty.")
  }

  try {
    return <InputApiAuditLog[]>JSON.parse(body)
  } catch (error) {
    return isError(error) ? error : Error("Error parsing JSON")
  }
}
