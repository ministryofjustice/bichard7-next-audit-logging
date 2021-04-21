import { isError, PromiseResult, AuditLogDynamoGateway, AuditLog } from "shared"
import { APIGatewayProxyResult } from "aws-lambda"
import createDynamoDbConfig from "src/createDynamoDbConfig"

const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "audit-log")
const isConditionalExpressionViolationError = (error: Error): boolean =>
  error.message === "The conditional request failed"

export default async function createAuditLog(log: AuditLog): PromiseResult<APIGatewayProxyResult> {
  const result = await auditLogGateway.create(log)

  if (isError(result) && isConditionalExpressionViolationError(result)) {
    return {
      statusCode: 500,
      body: `A message with Id ${log.messageId} already exists in the database`
    }
  }

  return {
    statusCode: 201,
    body: "Created"
  }
}
