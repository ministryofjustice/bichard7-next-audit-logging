import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AwsAuditLogDynamoGateway, HttpStatusCode, isError } from "shared"
import { createJsonApiResult } from "src/utils"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { CreateAuditLogEventUseCase, parseCreateAuditLogEventRequest, validateCreateAuditLogEvent } from "src/use-cases"

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
