import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { PromiseResult, AuditLogEvent } from "shared-types"
import { isError } from "shared-types"
import { AwsAuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway, HttpStatusCode, logger } from "shared"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { FetchEventsUseCase, parseGetEventsRequest } from "../use-cases"
import { createJsonApiResult } from "../utils"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import LookupEventValuesUseCase from "../use-cases/LookupEventValuesUseCase"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogLookupConfig, auditLogLookupConfig.TABLE_NAME)
const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupGateway)
const fetchEvents = new FetchEventsUseCase(auditLogGateway, lookupEventValuesUseCase)

export default async function getEvents(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
  const messageId = parseGetEventsRequest(event)

  if (isError(messageId)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: String(messageId)
    })
  }

  const result = await fetchEvents.get(messageId)

  if (isError(result)) {
    logger.error("Error creating audit log", result.message)
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: String(result)
    })
  }

  const events = result as AuditLogEvent[]
  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: events
  })
}
