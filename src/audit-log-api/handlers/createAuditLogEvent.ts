import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogEventsUseCase, parseCreateAuditLogEventRequest, validateCreateAuditLogEvent } from "../use-cases"
import { addAuditLogEventIndices, createJsonApiResult, statusCodeLookup, transformAuditLogEvent } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig)
const createAuditLogEventsUseCase = new CreateAuditLogEventsUseCase(auditLogGateway)

export default async function createAuditLogEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request = parseCreateAuditLogEventRequest(event)

  if (isError(request)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: request.message
    })
  }

  const { isValid, errors, auditLogEvent } = validateCreateAuditLogEvent(request.auditLogEvent)

  if (!isValid) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: errors.join(", ")
    })
  }

  const transformedAuditLogEvent = transformAuditLogEvent(auditLogEvent)
  const indexedAuditLogEvent = addAuditLogEventIndices(transformedAuditLogEvent)
  logger.info(
    `[${request.messageId}] - Logging event - ${indexedAuditLogEvent.eventType} (${indexedAuditLogEvent.eventCode})`
  )
  const result = await createAuditLogEventsUseCase.create(request.messageId, indexedAuditLogEvent)

  if (result.resultType === "success") {
    return createJsonApiResult({
      statusCode: HttpStatusCode.created,
      body: "Created"
    })
  }

  logger.error(result.resultDescription ?? `Unexpected error (${result.resultType})`)
  return createJsonApiResult({
    statusCode: statusCodeLookup[result.resultType] ?? (HttpStatusCode.internalServerError as never),
    body: result.resultDescription
  })
}
