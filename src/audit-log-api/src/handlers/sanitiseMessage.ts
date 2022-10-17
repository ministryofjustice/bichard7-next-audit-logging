import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { Duration } from "date-fns"
import { add } from "date-fns"
import { BichardPostgresGateway, createS3Config, HttpStatusCode, S3Gateway } from "shared"
import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import createBichardPostgresGatewayConfig from "../createBichardPostgresGatewayConfig"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import DeleteArchivedErrorsUseCase from "../use-cases/DeleteArchivedErrorsUseCase"
import DeleteAuditLogLookupItemsUseCase from "../use-cases/DeleteAuditLogLookupItemsUseCase"
import DeleteMessageObjectsFromS3UseCase from "../use-cases/DeleteMessageObjectsFromS3UseCase"
import FetchById from "../use-cases/FetchById"
import SanitiseAuditLogUseCase from "../use-cases/SanitiseAuditLogUseCase"
import shouldSanitiseMessage from "../use-cases/shouldSanitiseMessage"
import { createJsonApiResult } from "../utils"

const auditLogDynamoDbConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogDynamoDbConfig, auditLogDynamoDbConfig.TABLE_NAME)
const auditLogLookupDynamoDbConfig = createAuditLogLookupDynamoDbConfig()
const auditLogLookupDynamoGateway = new AwsAuditLogLookupDynamoGateway(
  auditLogLookupDynamoDbConfig,
  auditLogLookupDynamoDbConfig.TABLE_NAME
)
const postgresConfig = createBichardPostgresGatewayConfig()
const awsBichardPostgresGateway = new BichardPostgresGateway(postgresConfig)
const awsMessagesS3Gateway = new S3Gateway(createS3Config("INTERNAL_INCOMING_MESSAGES_BUCKET"))
const awsEventsS3Gateway = new S3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const deleteMessageObjectsFromS3UseCase = new DeleteMessageObjectsFromS3UseCase(
  awsMessagesS3Gateway,
  awsEventsS3Gateway
)
const sanitiseAuditLogUseCase = new SanitiseAuditLogUseCase(auditLogGateway)
const deleteAuditLogLookupItems = new DeleteAuditLogLookupItemsUseCase(auditLogLookupDynamoGateway)
const deleteArchivedErrorsUseCase = new DeleteArchivedErrorsUseCase(awsBichardPostgresGateway)

type SanitiseConfig = {
  checkFrequency: Duration
  sanitiseAfter: Duration
}

const getSanitiseConfig = (): SanitiseConfig => {
  const { SANITISE_AFTER_DAYS, CHECK_FREQUENCY_DAYS } = process.env

  const checkFrequency = CHECK_FREQUENCY_DAYS ? parseInt(CHECK_FREQUENCY_DAYS) : 2
  const sanitiseAfter = SANITISE_AFTER_DAYS ? parseInt(SANITISE_AFTER_DAYS) : 90

  return {
    checkFrequency: { days: checkFrequency },
    sanitiseAfter: { days: sanitiseAfter }
  }
}

export default async function sanitiseMessage(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const sanitiseConfig = getSanitiseConfig()
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

  const shouldSanitise = await shouldSanitiseMessage(awsBichardPostgresGateway, message, sanitiseConfig.sanitiseAfter)
  if (isError(shouldSanitise)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: shouldSanitise.message
    })
  }

  if (!shouldSanitise) {
    await auditLogGateway.updateSanitiseCheck(message, add(new Date(), sanitiseConfig.checkFrequency))
    return createJsonApiResult({
      statusCode: HttpStatusCode.ok,
      body: "Message not sanitised."
    })
  }

  const deleteMessageObjectsFromS3Result = await deleteMessageObjectsFromS3UseCase.call(message)
  if (isError(deleteMessageObjectsFromS3Result)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteMessageObjectsFromS3Result.message
    })
  }

  const deleteAuditLogLookupResult = await deleteAuditLogLookupItems.call(message.messageId)

  if (isError(deleteAuditLogLookupResult)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteAuditLogLookupResult.message
    })
  }

  const deleteArchivedErrorsResult = await deleteArchivedErrorsUseCase.call(message.messageId)

  if (isError(deleteArchivedErrorsResult)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteArchivedErrorsResult.message
    })
  }

  const sanitiseAuditLogResult = await sanitiseAuditLogUseCase.call(message)
  if (isError(sanitiseAuditLogResult)) {
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
