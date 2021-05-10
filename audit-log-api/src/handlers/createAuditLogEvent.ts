import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLogDynamoGateway, AuditLogEvent, HttpStatusCode, isError } from "shared"
import { createJsonApiResult } from "src/utils"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { CreateAuditLogEventUseCase } from "src/use-cases"

const config = createDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(config, config.AUDIT_LOG_TABLE_NAME)
const createAuditLogEventUseCase = new CreateAuditLogEventUseCase(auditLogGateway)

export default async function createAuditLogEvent(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const { messageId } = event.pathParameters

  const auditLogEvent = <AuditLogEvent>JSON.parse(event.body)
  const result = await createAuditLogEventUseCase.create(messageId, auditLogEvent)

  if (isError(result)) {
    const error = <Error>result

    if (error.name === "notFound") {
      return createJsonApiResult({
        statusCode: HttpStatusCode.notFound,
        body: result.message
      })
    }

    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: result.message
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.created,
    body: "Created"
  })
}
