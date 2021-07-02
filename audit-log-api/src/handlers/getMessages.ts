import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { isError, PromiseResult, AuditLogDynamoGateway, HttpStatusCode, AuditLog } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { FetchMessagesUseCase } from "src/use-cases"
import createMessageFetcher from "src/use-cases/createMessageFetcher"
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
  const messageFetcher = createMessageFetcher(event, fetchMessages)
  const messageFetcherResult = await messageFetcher.fetch()

  if (isError(messageFetcherResult)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: String(messageFetcherResult)
    })
  }

  if (messageFetcherResult === null) {
    return createOkResult([])
  }

  const messages = messageFetcherResult as AuditLog[]
  if (!!messages && Array.isArray(messages)) {
    return createOkResult(messages)
  }

  return createOkResult([messageFetcherResult as AuditLog])
}
