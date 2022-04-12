import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AwsAuditLogDynamoGateway, AwsS3Gateway, createS3Config, HttpStatusCode } from "shared"
import type { AuditLog } from "shared-types"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import FetchById from "../use-cases/FetchById"
import DeleteMessageObjectsFromS3UseCase from "../use-cases/DeleteMessageObjectsFromS3UseCase"
import { createJsonApiResult } from "../utils"
import SanitiseAuditLogUseCase from "../use-cases/SanitisAuditLogUseCase"

const config = createAuditLogDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(config, config.TABLE_NAME)
const awsS3Gateway = new AwsS3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const deleteMessageObjectsFromS3UseCase = new DeleteMessageObjectsFromS3UseCase(awsS3Gateway)
const sanitiseAuditLogUseCase = new SanitiseAuditLogUseCase(auditLogGateway)

/* eslint-disable require-await */
export default async function sanitiseMessage(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messageId = event.pathParameters?.messageId

  if (!messageId) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: "No message ID in request"
    })
  }

  const messageFetcher = new FetchById(auditLogGateway, messageId)
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
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: deleteMessageObjectsFromS3Result.message
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
