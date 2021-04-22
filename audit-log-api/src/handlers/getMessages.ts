import { isError, PromiseResult, AuditLogDynamoGateway, HttpStatusCode } from "shared"
import { APIGatewayProxyResult } from "aws-lambda"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import FetchMessagesUseCase from "src/use-cases"
import { createJsonApiResult } from "src/utils"

// TODO: Replace the table name with an env var
const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "audit-log")
const fetchMessages = new FetchMessagesUseCase(auditLogGateway)

export default async function getMessages(): PromiseResult<APIGatewayProxyResult> {
  const messages = await fetchMessages.get()

  if (isError(messages)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: String(messages)
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: { messages }
  })
}
