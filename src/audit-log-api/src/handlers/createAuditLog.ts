import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "shared"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogUseCase, parseCreateAuditLogRequest, validateCreateAuditLog } from "../use-cases"
import { createJsonApiResult } from "../utils"

const config = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.TABLE_NAME)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogGateway)

export default async function createAuditLog(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request = parseCreateAuditLogRequest(event)

  if (isError(request)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: request.message
    })
  }

  const { isValid, errors, auditLog } = await validateCreateAuditLog(request, auditLogGateway)

  if (!isValid) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: errors.join(", ")
    })
  }

  const result = await createAuditLogUseCase.create(auditLog)

  if (result.resultType === "conflict") {
    return createJsonApiResult({
      statusCode: HttpStatusCode.conflict,
      body: result.resultDescription
    })
  }

  if (result.resultType === "error") {
    logger.error("Error creating audit log", result.resultDescription)
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
