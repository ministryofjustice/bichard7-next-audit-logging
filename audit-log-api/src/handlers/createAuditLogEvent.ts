import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLogDynamoGateway, AuditLogEvent, HttpStatusCode } from "shared"
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
