import { isError, PromiseResult, AuditLogDynamoGateway, HttpStatusCode } from "shared"
import { APIGatewayProxyResult } from "aws-lambda"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import FetchMessagesUseCase from "src/use-cases"
import createJSONApiResult from "src/utils"

// TODO: Replace the table name with an env var
const auditLogGateway = new AuditLogDynamoGateway(createDynamoDbConfig(), "audit-log")
const fetchMessages = new FetchMessagesUseCase(auditLogGateway)

export default async function getMessages(): PromiseResult<APIGatewayProxyResult> {
  const messages = await fetchMessages.get()

  if (isError(messages)) {
    return createJSONApiResult({
      statusCode: HttpStatusCode.InternalServerError,
      body: String(messages)
    })
  }

  return createJSONApiResult({
    statusCode: HttpStatusCode.Ok,
    body: { messages }
  })
}
