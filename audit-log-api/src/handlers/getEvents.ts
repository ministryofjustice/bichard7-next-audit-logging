import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { isError, PromiseResult, AuditLogDynamoGateway, HttpStatusCode, AuditLogEvent } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { FetchEventsUseCase, parseGetEventsRequest } from "src/use-cases"
import { createJsonApiResult } from "src/utils"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
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
