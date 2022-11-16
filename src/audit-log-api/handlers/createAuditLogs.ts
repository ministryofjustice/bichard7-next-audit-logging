import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogsUseCase, parseCreateAuditLogsRequest, validateCreateAuditLogs } from "../use-cases"
import { createJsonApiResult } from "../utils"

const config = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config)
const createAuditLogsUseCase = new CreateAuditLogsUseCase(auditLogGateway)

export default async function createAuditLogs(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request = parseCreateAuditLogsRequest(event)

  if (isError(request)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: request.message
    })
  }

  const { isValid, errors, auditLogs } = await validateCreateAuditLogs(request, auditLogGateway)

  if (!isValid) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: errors.join(", ")
    })
  }

  const result = await createAuditLogsUseCase.create(auditLogs)

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
