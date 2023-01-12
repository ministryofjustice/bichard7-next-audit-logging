import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { HttpStatusCode, logger } from "src/shared"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import { CreateAuditLogUserEventsUseCase, validateCreateAuditLogEvents } from "../use-cases"
import { createJsonApiResult, statusCodeLookup, transformAuditLogEvent } from "../utils"

const auditLogConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogConfig)
const createAuditLogUserEventUseCase = new CreateAuditLogUserEventsUseCase(auditLogGateway)

export default async function createAuditLogUserEvents(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const userName = event.pathParameters?.userName
  const { body } = event

  if (!userName) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: "UserName cannot be null."
    })
  }

  if (!body) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: "Body cannot be empty."
    })
  }

  let jsonBody
  try {
    jsonBody = JSON.parse(body)
  } catch (error) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: `Could not parse body. ${(error as Error).message}`
    })
  }

  const unvalidatedEvents = Array.isArray(jsonBody) ? jsonBody : [jsonBody]
  const { isValid, eventValidationResults } = validateCreateAuditLogEvents(unvalidatedEvents)

  if (!isValid) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: eventValidationResults.map((result) => {
        return { eventTimestamp: result.timestamp, errors: result.errors, isValid: result.errors.length === 0 }
      })
    })
  }

  const auditLogEvents = eventValidationResults.map((result) => result.auditLogEvent)
  // TODO: Eventually do transformation in event handler, and remove from use case
  const transformedAuditLogEvents = auditLogEvents.map(transformAuditLogEvent)
  const result = await createAuditLogUserEventUseCase.create(userName, transformedAuditLogEvents)

  if (result.resultType === "success") {
    return createJsonApiResult({
      statusCode: HttpStatusCode.created,
      body: "Created"
    })
  }

  logger.error(result.resultDescription ?? `Unexpected error (${result.resultType})`)
  return createJsonApiResult({
    statusCode: statusCodeLookup[result.resultType] ?? HttpStatusCode.internalServerError,
    body: result.resultDescription
  })
}
