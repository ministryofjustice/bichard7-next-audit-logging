import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import type { PromiseResult } from "shared-types"
import { isError } from "shared-types"
import { AwsAuditLogDynamoGateway, HttpStatusCode } from "shared"
import createDynamoDbConfig from "src/createDynamoDbConfig"
import { parseRetryMessageRequest, RetryMessageUseCase } from "src/use-cases"
import { createJsonApiResult } from "src/utils"
import { StompitMqGateway, createMqConfig } from "shared"
import GetLastFailedMessageEventUseCase from "src/use-cases/GetLastEventUseCase"
import { AuditLogApiClient } from "shared"
import { AwsS3Gateway } from "shared"
import getApiUrl from "src/getApiUrl"
import RetrieveEventXmlFromS3UseCase from "src/use-cases/RetrieveEventXmlFromS3UseCase"
import CreateRetryingEventUseCase from "src/use-cases/CreateRetryingEventUseCase"
import SendMessageToQueueUseCase from "src/use-cases/SendMessageToQueueUseCase"
import createS3Config from "src/createS3Config"
import getApiKey from "src/getApiKey"

const auditLogGatewayConfig = createDynamoDbConfig()
const auditLogGateway = new AwsAuditLogDynamoGateway(auditLogGatewayConfig, auditLogGatewayConfig.AUDIT_LOG_TABLE_NAME)

const mqGatewayConfig = createMqConfig()
const mqGateway = new StompitMqGateway(mqGatewayConfig)
const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

const awsS3Gateway = new AwsS3Gateway(createS3Config())
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
    console.error("Error retrying message", retryMessageResult.message)
    return createJsonApiResult({
      statusCode: HttpStatusCode.internalServerError,
      body: String(retryMessageResult)
    })
  }

  return createJsonApiResult({
    statusCode: HttpStatusCode.ok,
    body: ""
  })
}
