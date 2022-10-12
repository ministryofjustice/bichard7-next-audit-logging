import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import {
  AwsAuditLogDynamoGateway,
  AwsAuditLogLookupDynamoGateway,
  AwsBichardPostgresGateway,
  AwsS3Gateway,
  createS3Config,
  HttpStatusCode
} from "shared"
import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import createBichardPostgresGatewayConfig from "../createBichardPostgresGatewayConfig"
import DeleteArchivedErrorsUseCase from "../use-cases/DeleteArchivedErrorsUseCase"
import DeleteAuditLogLookupItemsUseCase from "../use-cases/DeleteAuditLogLookupItemsUseCase"
import DeleteMessageObjectsFromS3UseCase from "../use-cases/DeleteMessageObjectsFromS3UseCase"
import FetchById from "../use-cases/FetchById"
import SanitiseAuditLogUseCase from "../use-cases/SanitiseAuditLogUseCase"
import { createJsonApiResult } from "../utils"

const auditLogDynamoDbConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogDynamoDbConfig, auditLogDynamoDbConfig.TABLE_NAME)
const auditLogLookupDynamoDbConfig = createAuditLogLookupDynamoDbConfig()
const auditLogLookupDynamoGateway = new AwsAuditLogLookupDynamoGateway(
  auditLogLookupDynamoDbConfig,
  auditLogLookupDynamoDbConfig.TABLE_NAME
)
const postgresConfig = createBichardPostgresGatewayConfig()
const awsBichardPostgresGateway = new AwsBichardPostgresGateway(postgresConfig)
const awsMessagesS3Gateway = new AwsS3Gateway(createS3Config("INTERNAL_INCOMING_MESSAGES_BUCKET"))
const awsEventsS3Gateway = new AwsS3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const deleteMessageObjectsFromS3UseCase = new DeleteMessageObjectsFromS3UseCase(
  awsMessagesS3Gateway,
  awsEventsS3Gateway
)
const sanitiseAuditLogUseCase = new SanitiseAuditLogUseCase(auditLogGateway)
const deleteAuditLogLookupItems = new DeleteAuditLogLookupItemsUseCase(auditLogLookupDynamoGateway)
const deleteArchivedErrorsUseCase = new DeleteArchivedErrorsUseCase(awsBichardPostgresGateway)

export default async function sanitiseMessage(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messageId = event.pathParameters?.messageId

  if (!messageId) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: "No message ID in request"
    })
  }

  const messageFetcher = new FetchById(auditLogGateway, messageId, {
    includeColumns: ["automationReport", "topExceptionsReport", "version"]
  })
  const messageFetcherResult = await messageFetcher.fetch()

  if (isError(messageFetcherResult)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: messageFetcherResult.message
    })
  }

  if (!messageFetcherResult) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.notFound,
      body: "Message id not found"
    })
  }

  const message = messageFetcherResult as AuditLog

  const deleteMessageObjectsFromS3Result = await deleteMessageObjectsFromS3UseCase.call(message)
  if (isError(deleteMessageObjectsFromS3Result)) {
    console.log("deleteMessageObjectsFromS3Result error")
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteMessageObjectsFromS3Result.message
    })
  }

  const deleteAuditLogLookupResult = await deleteAuditLogLookupItems.call(message.messageId)

  if (isError(deleteAuditLogLookupResult)) {
    console.log("deleteAuditLogLookupResult error")
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteAuditLogLookupResult.message
    })
  }

  const deleteArchivedErrorsResult = await deleteArchivedErrorsUseCase.call(message.messageId)

  if (isError(deleteArchivedErrorsResult)) {
    console.log("deleteArchivedErrorsResult error")
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteArchivedErrorsResult.message
    })
  }

  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)
  if (isError(sanitiseAuditLogResult)) {
    console.log("sanitiseAuditLogResult error")
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: sanitiseAuditLogResult.message
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.noContent,
    body: ""
  })
}
