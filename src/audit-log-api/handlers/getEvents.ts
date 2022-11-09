import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import { FetchEventsUseCase, parseGetEventsRequest } from "../use-cases"
import LookupEventValuesUseCase from "../use-cases/LookupEventValuesUseCase"
import { createJsonApiResult, transformAuditLogEvent } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig)
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogConfig, auditLogConfig.lookupTableName)
const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupGateway)
const fetchEvents = new FetchEventsUseCase(auditLogGateway, lookupEventValuesUseCase)

export default async function getEvents(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const getEventsProperties = parseGetEventsRequest(event)

  if (isError(getEventsProperties)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: String(getEventsProperties)
    })
  }

  const { messageId, fetchLargeObjects } = getEventsProperties

  const result = await fetchEvents.get(messageId, fetchLargeObjects)

  if (isError(result)) {
    logger.error("Error creating audit log", result.message)
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: String(result)
    })
  }

  const events = result.map(transformAuditLogEvent)
  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: events
  })
}
