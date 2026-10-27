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
import { RetryMessageUseCase, parseRetryMessageRequest } from "../use-cases"
import CreateRetryingEventUseCase from "../use-cases/CreateRetryingEventUseCase"
import GetLastFailedMessageEventUseCase from "../use-cases/GetLastEventUseCase"
import RetrieveEventXmlFromS3UseCase from "../use-cases/RetrieveEventXmlFromS3UseCase"
import SendMessageToQueueUseCase from "../use-cases/SendMessageToQueueUseCase"
import { createJsonApiResult } from "../utils"
import { SSMClient } from "@aws-sdk/client-ssm"
import getConfigValue from "src/shared/utils/getConfigValue"

const auditLogGatewayConfig = createAuditLogDynamoDbConfig()
const auditLogGateway = new AuditLogDynamoGateway(auditLogGatewayConfig)

const getLastEventUseCase = new GetLastFailedMessageEventUseCase(auditLogGateway)

export const handler = async function retryMessage(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  const ssmClient = new SSMClient()

  const mqGatewayConfig = await createMqConfig(ssmClient)
  const mqGateway = new MqGateway(mqGatewayConfig)
  const sendMessageToQueueUseCase = new SendMessageToQueueUseCase(mqGateway)

  const s3Gateway = new S3Gateway(createS3Config("AUDIT_LOG_EVENTS_BUCKET"))
  const retrieveEventXmlFromS3UseCase = new RetrieveEventXmlFromS3UseCase(s3Gateway)

  const apiUrl = await getConfigValue(ssmClient, process.env.API_URL, "")
  const apiKey = await getConfigValue(ssmClient, process.env.API_KEY, "")
  const apiClient = new AuditLogApiClient(apiUrl, apiKey)
  const createRetryingEventUseCase = new CreateRetryingEventUseCase(apiClient)

  const retryMessageUseCase = new RetryMessageUseCase(
    getLastEventUseCase,
    sendMessageToQueueUseCase,
    retrieveEventXmlFromS3UseCase,
    createRetryingEventUseCase
  )

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
