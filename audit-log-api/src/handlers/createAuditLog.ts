import { isError, PromiseResult, AuditLogDynamoGateway, AuditLog, HttpStatusCode } from "shared"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import createJSONApiResult from "src/utils"

// TODO: Replace the table name with an env var
const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "audit-log")
const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.message === "The conditional request failed"

export default async function createAuditLog(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const log = <AuditLog>JSON.parse(event.body)
  const result = await auditLogGateway.create(log)

  if (isError(result) && isConditionalExpressionViolationError(result)) {
    return createJSONApiResult({
      statusCode: HttpStatusCode.conflict,
      body: `A message with Id ${log.messageId} already exists in the database`
    })
  }

  return createJSONApiResult({
    statusCode: HttpStatusCode.created,
    body: "Created"
  })
}
