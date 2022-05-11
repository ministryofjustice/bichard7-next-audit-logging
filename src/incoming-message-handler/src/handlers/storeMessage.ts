import type { AuditLog, S3PutObjectEvent } from "shared-types"
import { AuditLogApiClient, AwsS3Gateway, createS3Config, logger } from "shared"
import { isError } from "shared-types"
import readMessage from "../use-cases/readMessage"
import { getApiKey, getApiUrl } from "../configs"
import retrieveMessageFromS3 from "../use-cases/retrieveMessageFromS3"
import formatMessage from "../use-cases/formatMessage"
import CreateAuditLogUseCase from "src/use-cases/CreateAuditLogUseCase"

interface StoreMessageResult {
  auditLog: AuditLog
  messageXml: string
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}

interface StoreMessageValidationResult {
  validationResult: ValidationResult
  bucketName: string
  s3Path: string
}

const s3Gateway = new AwsS3Gateway(createS3Config())
const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())
const createAuditLogUseCase = new CreateAuditLogUseCase(apiClient)

const createValidationResult = (validationResult: ValidationResult, event: S3PutObjectEvent) => ({
  validationResult,
  bucketName: event.detail.requestParameters.bucketName,
  s3Path: event.detail.requestParameters.key
})

export default async function storeMessage(
  event: S3PutObjectEvent
): Promise<StoreMessageResult | StoreMessageValidationResult> {
  const receivedMessage = await retrieveMessageFromS3(event, s3Gateway)

  if (isError(receivedMessage)) {
    throw receivedMessage
  }

  if ("isValid" in receivedMessage) {
    logger.info(JSON.stringify(receivedMessage))
    return createValidationResult(receivedMessage, event)
  }

  const formattedMessage = await formatMessage(receivedMessage)

  if (isError(formattedMessage)) {
    throw formattedMessage
  }

  const auditLog = await readMessage(formattedMessage)

  if (isError(auditLog)) {
    throw auditLog
  }

  const createAuditLogResult = await createAuditLogUseCase.execute(auditLog)

  if (isError(createAuditLogResult)) {
    throw createAuditLogResult
  }

  if (!createAuditLogResult.isValid) {
    logger.info(JSON.stringify(createAuditLogResult))
    return createValidationResult(createAuditLogResult, event)
  }

  return { auditLog, messageXml: formattedMessage.messageXml }
}
