import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { PromiseResult, AuditLogEvent } from "shared-types"
import { isError } from "shared-types"
import { AwsAuditLogDynamoGateway, HttpStatusCode } from "shared"
import createDynamoDbConfig from "../createDynamoDbConfig"
import { FetchEventsUseCase, parseGetEventsRequest } from "../use-cases"
import { createJsonApiResult } from "../utils"

const config = createDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
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
    console.error("Error creating audit log", result.message)
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
