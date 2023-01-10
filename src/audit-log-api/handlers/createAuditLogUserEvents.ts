import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode } from "src/shared"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogUserEventsUseCase } from "../use-cases"
import { createJsonApiResult } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig)
const createAuditLogEventUseCase = new CreateAuditLogUserEventsUseCase(auditLogGateway)

export default async function createAuditLogUserEvents(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userName = event.pathParameters?.userName

  if (!userName) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: "UserName cannot be null."
    })
  }

  await createAuditLogEventUseCase.create(userName, [])

  return { statusCode: HttpStatusCode.created, body: "Created" }
}
