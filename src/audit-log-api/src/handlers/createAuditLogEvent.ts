import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { isError } from "shared-types"
import { AwsAuditLogDynamoGateway, HttpStatusCode } from "shared"
import { createJsonApiResult } from "../utils"
import createDynamoDbConfig from "../createDynamoDbConfig"
import { CreateAuditLogEventUseCase, parseCreateAuditLogEventRequest, validateCreateAuditLogEvent } from "../use-cases"

const config = createDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogEventUseCase = new CreateAuditLogEventUseCase(auditLogGateway)

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

  if (result.resultType === "error") {
    console.error("Error creating audit log", result.resultDescription)
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