import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import createMessageFetcher from "../use-cases/createMessageFetcher"
import { createJsonApiResult } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig)

export default async function getMessages(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messageFetcher = createMessageFetcher(event, auditLogGateway)

  if (isError(messageFetcher)) {
    logger.error(`Error fetching messages: ${messageFetcher.message}`)
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: messageFetcher.message
    })
  }

  const messageFetcherResult = await messageFetcher.fetch()

  if (isError(messageFetcherResult)) {
    logger.error(`Error fetching messages: ${messageFetcherResult.message}`)
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: String(messageFetcherResult)
    })
  }

  if (!messageFetcherResult) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.notFound,
      body: []
    })
  }

  const messages = Array.isArray(messageFetcherResult) ? messageFetcherResult : [messageFetcherResult]

  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: messages
  })
}
