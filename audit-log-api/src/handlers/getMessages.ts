import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { isError, PromiseResult, AuditLogDynamoGateway, HttpStatusCode, AuditLog } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { FetchMessagesUseCase } from "src/use-cases"
import { createJsonApiResult } from "src/utils"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const fetchMessages = new FetchMessagesUseCase(auditLogGateway)

export default async function getMessages(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const messageId = event.pathParameters?.messageId

  const fetchMessagesResult = messageId ? await fetchMessages.getById(messageId) : await fetchMessages.get()

  if (isError(fetchMessagesResult)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: String(fetchMessagesResult)
    })
  }

  const messages = fetchMessagesResult as AuditLog[]
  if (!!messages && Array.isArray(messages)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.ok,
      body: messages
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: fetchMessagesResult as AuditLog
  })
}
