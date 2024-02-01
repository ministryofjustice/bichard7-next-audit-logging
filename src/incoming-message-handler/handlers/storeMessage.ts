import { AuditLogApiClient, createS3Config, logger, S3Gateway } from "src/shared"
import type { InputApiAuditLog, S3PutObjectEvent } from "src/shared/types"
import { isError } from "src/shared/types"
import { getApiKey, getApiUrl } from "../configs"
import CreateAuditLogUseCase from "../use-cases/CreateAuditLogUseCase"
import CreateDuplicateMessageEvent from "../use-cases/CreateDuplicateMessageEvent"
import formatMessage from "../use-cases/formatMessage"
import logBadUnicode from "../use-cases/logBadUnicode"
import readMessage from "../use-cases/readMessage"
import retrieveMessageFromS3 from "../use-cases/retrieveMessageFromS3"

interface StoreMessageResult {
  auditLog: InputApiAuditLog
  messageXml: string
}

export interface ValidationResult {
  isValid: boolean
  message?: string
  isDuplicate?: boolean
}

interface StoreMessageValidationResult {
  validationResult: ValidationResult
  bucketName: string
  s3Path: string
}

const s3Gateway = new S3Gateway(createS3Config())
const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())
const createAuditLogUseCase = new CreateAuditLogUseCase(apiClient)
const createDuplicateMessageEvent = new CreateDuplicateMessageEvent(apiClient)

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

  logBadUnicode(receivedMessage)

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

  if (!createAuditLogResult.isValid || createAuditLogResult.isDuplicate) {
    logger.info(JSON.stringify(createAuditLogResult))
    return createValidationResult(createAuditLogResult, event)
  }

  return { auditLog, messageXml: formattedMessage.messageXml }
}
