import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLogDynamoGateway, AuditLog, HttpStatusCode } from "shared"
import { createJsonApiResult } from "src/utils"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { CreateAuditLogUseCase } from "src/use-cases"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogGateway)

export default async function createAuditLog(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const auditLog = <AuditLog>JSON.parse(event.body)
  const result = await createAuditLogUseCase.create(auditLog)

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
