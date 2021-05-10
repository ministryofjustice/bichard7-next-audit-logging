import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLogDynamoGateway, AuditLog, HttpStatusCode, isError } from "shared"
import { createJsonApiResult } from "src/utils"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { CreateAuditLogUseCase } from "src/use-cases"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogUseCase = new CreateAuditLogUseCase(auditLogGateway)

export default async function createAuditLog(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const auditLog = <AuditLog>JSON.parse(event.body)
  const result = await createAuditLogUseCase.create(auditLog)

  if (isError(result)) {
    const error = <Error>result
    if (error.name === "conflict") {
      return createJsonApiResult({
        statusCode: HttpStatusCode.conflict,
        body: error.message
      })
    }

    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: error.message
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.created,
    body: "Created"
  })
}
