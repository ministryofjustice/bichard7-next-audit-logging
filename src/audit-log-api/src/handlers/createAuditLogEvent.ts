import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "shared"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogEventUseCase, parseCreateAuditLogEventRequest, validateCreateAuditLogEvent } from "../use-cases"
import StoreValuesInLookupTableUseCase from "../use-cases/StoreValuesInLookupTableUseCase"
import { addAuditLogEventIndices, createJsonApiResult, statusCodeLookup, transformAuditLogEvent } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogLookupConfig, auditLogLookupConfig.TABLE_NAME)
const storeValuesInLookupTableUseCase = new StoreValuesInLookupTableUseCase(auditLogLookupGateway)
const createAuditLogEventUseCase = new CreateAuditLogEventUseCase(auditLogGateway, storeValuesInLookupTableUseCase)

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
  const result = await createAuditLogEventUseCase.create(request.messageId, indexedAuditLogEvent)

  if (result.resultType === "success") {
    return createJsonApiResult({
      statusCode: HttpStatusCode.created,
      body: "Created"
    })
  }

  logger.error(result.resultDescription ?? `Unexpected error (${result.resultType})`)
  return createJsonApiResult({
    statusCode: statusCodeLookup[result.resultType] ?? HttpStatusCode.internalServerError,
    body: result.resultDescription
  })
}
