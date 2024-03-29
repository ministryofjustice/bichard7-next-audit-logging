import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import {
  AuditLogApiClient,
  HttpStatusCode,
  MqGateway,
  S3Gateway,
  createMqConfig,
  createS3Config,
  logger
} from "src/shared"
import { isError } from "src/shared/types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { AuditLogDynamoGateway } from "../gateways/dynamo"
import getApiKey from "../getApiKey"
import getApiUrl from "../getApiUrl"
import { RetryMessageUseCase, parseRetryMessageRequest } from "../use-cases"
import CreateRetryingEventUseCase from "../use-cases/CreateRetryingEventUseCase"
import GetLastFailedMessageEventUseCase from "../use-cases/GetLastEventUseCase"
import RetrieveEventXmlFromS3UseCase from "../use-cases/RetrieveEventXmlFromS3UseCase"
import SendMessageToQueueUseCase from "../use-cases/SendMessageToQueueUseCase"
import { createJsonApiResult } from "../utils"

const auditLogGatewayConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogGatewayConfig)

const mqGatewayConfig = createMqConfig()
const mqGateway = new MqGateway(mqGatewayConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogGateway)

const s3Gateway = new S3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())
const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

const retryMessageUseCase = new RetryMessageUseCase(
  getLastEventUseCase,
  sendMessageToQueueUseCase,
  retrieveEventXmlFromS3UseCase,
  createRetryingEventUseCase
)

export default async function retryMessage(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const messageId = parseRetryMessageRequest(event)

  if (isError(messageId)) {
    return createJsonApiResult({
      statusCode: HttpStatusCode.badRequest,
      body: String(messageId)
    })
  }

  const retryMessageResult = await retryMessageUseCase.retry(messageId)

  if (isError(retryMessageResult)) {
    logger.error(`Error fetching messages: ${retryMessageResult.message}`)
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: String(retryMessageResult)
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.noContent,
    body: ""
  })
}
