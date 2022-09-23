import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { isError } from "shared-types"
import { AwsAuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway, HttpStatusCode, logger } from "shared"
import { createJsonApiResult } from "../utils"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import {
  CreateAuditLogEventsUseCase,
  parseCreateAuditLogEventsRequest,
  validateCreateAuditLogEvents
} from "../use-cases"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import StoreValuesInLookupTableUseCase from "../use-cases/StoreValuesInLookupTableUseCase"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
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

  const { isValid, errors, auditLogEvents } = validateCreateAuditLogEvents(request.auditLogEvents)

  if (!isValid) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: errors.join(", ")
    })
  }

  const result = await createAuditLogEventUseCase.create(request.messageId, auditLogEvents)

  if (result.resultType === "notFound") {
    return createJsonApiResult({
      statusCode: HttpStatusCode.notFound,
      body: result.resultDescription
    })
  }

  if (result.resultType === "invalidVersion") {
    logger.error(`Message version is invalid: ${result.resultDescription}`)
    return createJsonApiResult({
      statusCode: HttpStatusCode.conflict,
      body: result.resultDescription
    })
  }

  if (result.resultType === "transactionFailed") {
    logger.error(`Transaction failed: ${result.resultDescription}`)
    return createJsonApiResult({
      statusCode: HttpStatusCode.conflict,
      body: result.resultDescription
    })
  }

  if (result.resultType === "error") {
    logger.error(`Error creating audit log: ${result.resultDescription}`)
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: result.resultDescription
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.created,
    body: "Created"
  })
}
