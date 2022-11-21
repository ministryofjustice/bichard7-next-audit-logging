import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import {
  AuditLogApiClient,
  createMqConfig,
  createS3Config,
  HttpStatusCode,
  logger,
  MqGateway,
  S3Gateway
} from "src/shared"
import type { PromiseResult } from "src/shared/types"
import { isError } from "src/shared/types"
import getApiKey from "../getApiKey"
import getApiUrl from "../getApiUrl"
import { parseRetryMessageRequest, RetryMessageUseCase } from "../use-cases"
import CreateRetryingEventUseCase from "../use-cases/CreateRetryingEventUseCase"
import RetrieveEventXmlFromS3UseCase from "../use-cases/RetrieveEventXmlFromS3UseCase"
import SendMessageToQueueUseCase from "../use-cases/SendMessageToQueueUseCase"
import { createJsonApiResult } from "../utils"

const mqGatewayConfig = createMqConfig()
const mqGateway = new MqGateway(mqGatewayConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const s3Gateway = new S3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())
const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

const retryMessageUseCase = new RetryMessageUseCase(
  sendMessageToQueueUseCase,
  retrieveEventXmlFromS3UseCase,
  createRetryingEventUseCase
)

export default async function retryMessage(event: APIGatewayProxyEvent): PromiseResult<APIGatewayProxyResult> {
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
