import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { PromiseResult } from "shared-types"
import { isError } from "shared-types"
import {
  AwsAuditLogDynamoGateway,
  HttpStatusCode,
  StompitMqGateway,
  createMqConfig,
  AuditLogApiClient,
  AwsS3Gateway,
  createS3Config,
  logger
} from "shared"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import { parseRetryMessageRequest, RetryMessageUseCase } from "../use-cases"
import { createJsonApiResult } from "../utils"
import GetLastFailedMessageEventUseCase from "../use-cases/GetLastEventUseCase"
import getApiUrl from "../getApiUrl"
import RetrieveEventXmlFromS3UseCase from "../use-cases/RetrieveEventXmlFromS3UseCase"
import CreateRetryingEventUseCase from "../use-cases/CreateRetryingEventUseCase"
import SendMessageToQueueUseCase from "../use-cases/SendMessageToQueueUseCase"
import getApiKey from "../getApiKey"

const auditLogGatewayConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogGatewayConfig, auditLogGatewayConfig.TABLE_NAME)

const mqGatewayConfig = createMqConfig()
const mqGateway = new StompitMqGateway(mqGatewayConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const awsS3Gateway = new AwsS3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(awsS3Gateway)

const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())
const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogGateway)
const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

const retryMessageUseCase = new RetryMessageUseCase(
  getLastEventUseCase,
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
