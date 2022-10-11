import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AwsAuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway, HttpStatusCode, logger } from "shared"
import type { AuditLog, PromiseResult } from "shared-types"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import createMessageFetcher from "../use-cases/createMessageFetcher"
import LookupEventValuesUseCase from "../use-cases/LookupEventValuesUseCase"
import LookupMessageValuesUseCase from "../use-cases/LookupMessageValuesUseCase"
import { createJsonApiResult } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogLookupConfig, auditLogLookupConfig.TABLE_NAME)
const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupGateway)
const lookupMessageValuesUseCase = new LookupMessageValuesUseCase(lookupEventValuesUseCase)

export default async function getMessages(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
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

  let messages = messageFetcherResult as AuditLog[]
  if (!!messages && !Array.isArray(messages)) {
    messages = [messageFetcherResult as AuditLog]
  }

  for (let index = 0; index < messages.length; index++) {
    const lookupMessageValuesResult = await lookupMessageValuesUseCase.execute(messages[index])

    if (isError(lookupMessageValuesResult)) {
      return createJsonApiResult({
        statusCode: HttpStatusCode.internalServerError,
        body: String(lookupMessageValuesResult)
      })
    }

    messages[index] = lookupMessageValuesResult
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: messages
  })
}
