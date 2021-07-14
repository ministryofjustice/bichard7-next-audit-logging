import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { PromiseResult, AuditLogEvent } from "shared"
import { isError, AwsAuditLogDynamoGateway, HttpStatusCode } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { FetchEventsUseCase, parseGetEventsRequest } from "src/use-cases"
import { createJsonApiResult } from "src/utils"

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
