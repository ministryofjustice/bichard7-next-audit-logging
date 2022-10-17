import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { AuditLogApiClient, createMqConfig, createS3Config, HttpStatusCode, logger, MqGateway, S3Gateway } from "shared"
import type { PromiseResult } from "shared-types"
import { isError } from "shared-types"
import createAuditLogDynamoDbConfig from "../createAuditLogDynamoDbConfig"
import createAuditLogLookupDynamoDbConfig from "../createAuditLogLookupDynamoDbConfig"
import { AuditLogDynamoGateway, AwsAuditLogLookupDynamoGateway } from "../gateways/dynamo"
import getApiKey from "../getApiKey"
import getApiUrl from "../getApiUrl"
import { parseRetryMessageRequest, RetryMessageUseCase } from "../use-cases"
import CreateRetryingEventUseCase from "../use-cases/CreateRetryingEventUseCase"
import GetLastFailedMessageEventUseCase from "../use-cases/GetLastEventUseCase"
import LookupEventValuesUseCase from "../use-cases/LookupEventValuesUseCase"
import RetrieveEventXmlFromS3UseCase from "../use-cases/RetrieveEventXmlFromS3UseCase"
import SendMessageToQueueUseCase from "../use-cases/SendMessageToQueueUseCase"
import { createJsonApiResult } from "../utils"

const auditLogGatewayConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogGatewayConfig, auditLogGatewayConfig.TABLE_NAME)
const auditLogLookupGatewayConfig = createAuditLogLookupDynamoDbConfig()
const auditLogLookupGateway = new AwsAuditLogLookupDynamoGateway(
  auditLogLookupGatewayConfig,
  auditLogLookupGatewayConfig.TABLE_NAME
)

const mqGatewayConfig = createMqConfig()
const mqGateway = new MqGateway(mqGatewayConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const lookupEventValuesUseCase = new LookupEventValuesUseCase(auditLogLookupGateway)
const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogGateway, lookupEventValuesUseCase)

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
