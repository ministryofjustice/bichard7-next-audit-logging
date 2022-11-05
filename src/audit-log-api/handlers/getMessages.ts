import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import createMessageFetcher from "../use-cases/createMessageFetcher"
import LookupEventValuesUseCase from "../use-cases/LookupEventValuesUseCase"
import LookupMessageValuesUseCase from "../use-cases/LookupMessageValuesUseCase"
import { createJsonApiResult, shouldFetchLargeObjects, transformAuditLogEvent } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogLookupConfig, auditLogLookupConfig.TABLE_NAME)
const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupGateway)
const lookupMessageValuesUseCase = new LookupMessageValuesUseCase(lookupEventValuesUseCase)

export default async function getMessages(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const messageFetcher = createMessageFetcher(event, auditLogGateway)
  const fetchLargeObjects = shouldFetchLargeObjects(event.queryStringParameters?.largeObjects)

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
  messages.forEach((m) => {
    if (m.events) {
      m.events = m.events.map(transformAuditLogEvent)
    }
  })

  if (fetchLargeObjects) {
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
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: messages
  })
}
