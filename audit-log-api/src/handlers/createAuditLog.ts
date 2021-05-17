import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLogDynamoGateway, HttpStatusCode, isError } from "shared"
import { createJsonApiResult } from "src/utils"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { CreateAuditLogUseCase, parseCreateAuditLogRequest } from "src/use-cases"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogGateway)

export default async function createAuditLog(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const request = parseCreateAuditLogRequest(event)

  if (isError(request)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: request.message
    })
  }

  const result = await createAuditLogUseCase.create(request)

  if (result.resultType === "conflict") {
    return createJsonApiResult({
      statusCode: HttpStatusCode.conflict,
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
