import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import {
  CreateAuditLogEventsUseCase,
  parseCreateAuditLogEventsRequest,
  validateCreateAuditLogEvents
} from "../use-cases"
import StoreValuesInLookupTableUseCase from "../use-cases/StoreValuesInLookupTableUseCase"
import { addAuditLogEventIndices, createJsonApiResult, statusCodeLookup, transformAuditLogEvent } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(auditLogLookupConfig, auditLogLookupConfig.TABLE_NAME)
const storeValuesInLookupTableUseCase = new StoreValuesInLookupTableUseCase(auditLogLookupGateway)
const createAuditLogEventUseCase = new CreateAuditLogEventsUseCase(auditLogGateway, storeValuesInLookupTableUseCase)

export default async function createAuditLogEvents(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request = parseCreateAuditLogEventsRequest(event)

  if (isError(request)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: request.message
    })
  }

  const { isValid, eventValidationResults } = validateCreateAuditLogEvents(request.auditLogEvents)

  if (!isValid) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: eventValidationResults.map((result) => {
        return { eventTimestamp: result.timestamp, errors: result.errors, isValid: result.errors.length === 0 }
      })
    })
  }

  const auditLogEvents = eventValidationResults.map((result) => result.auditLogEvent)
  const transformedAuditLogEvents = auditLogEvents.map(transformAuditLogEvent)
  const indexedAuditLogEvents = transformedAuditLogEvents.map(addAuditLogEventIndices)
  const result = await createAuditLogEventUseCase.create(request.messageId, indexedAuditLogEvents)

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
