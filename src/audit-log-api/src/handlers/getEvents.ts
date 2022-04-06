import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { PromiseResult, AuditLogEvent } from "shared-types"
import { isError } from "shared-types"
import { AwsAuditLogDynamoGateway, HttpStatusCode, logger } from "shared"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { FetchEventsUseCase, parseGetEventsRequest } from "../use-cases"
import { createJsonApiResult } from "../utils"

const config = createAuditLogDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(config, config.TABLE_NAME)
const fetchEvents = new FetchEventsUseCase(auditLogGateway)

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
