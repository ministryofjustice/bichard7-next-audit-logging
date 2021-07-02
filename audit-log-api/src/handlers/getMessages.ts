import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { isError, PromiseResult, AuditLogDynamoGateway, HttpStatusCode, AuditLog } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { FetchMessagesUseCase } from "src/use-cases"
import parseGetMessagesRequest from "src/use-cases/parseGetMessagesRequest"
import { createJsonApiResult } from "src/utils"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const fetchMessages = new FetchMessagesUseCase(auditLogGateway)

const createOkResult = (messages: AuditLog[]): APIGatewayProxyResult =>
  createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: messages
  })

export default async function getMessages(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const { messageFetcher } = parseGetMessagesRequest(event, fetchMessages)
  const fetchMessagesResult = await messageFetcher.fetch()

  if (isError(fetchMessagesResult)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: String(fetchMessagesResult)
    })
  }

  if (fetchMessagesResult === null) {
    return createOkResult([])
  }

  const messages = fetchMessagesResult as AuditLog[]
  if (!!messages && Array.isArray(messages)) {
    return createOkResult(messages)
  }

  return createOkResult([fetchMessagesResult as AuditLog])
}
