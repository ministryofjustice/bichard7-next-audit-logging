import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "shared"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import { AwsAuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogEventUseCase, parseCreateAuditLogEventRequest, validateCreateAuditLogEvent } from "../use-cases"
import StoreValuesInLookupTableUseCase from "../use-cases/StoreValuesInLookupTableUseCase"
import { createJsonApiResult } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogLookupConfig = createAuditLogLookupDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogConfig, auditLogConfig.TABLE_NAME)
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

  const result = await createAuditLogEventUseCase.create(request.messageId, auditLogEvent)

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
