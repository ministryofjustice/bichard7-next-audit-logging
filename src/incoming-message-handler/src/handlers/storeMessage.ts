import type { AuditLog, S3PutObjectEvent } from "shared-types"
import { AuditLogApiClient, AwsS3Gateway, createS3Config } from "shared"
import { isError } from "shared-types"
import readMessage from "../use-cases/readMessage"
import { getApiKey, getApiUrl } from "../configs"
import retrieveMessageFromS3 from "../use-cases/retrieveMessageFromS3"
import formatMessage from "../use-cases/formatMessage"
import validateMessageHash from "src/use-cases/validateMessageHash"

interface StoreMessageResult {
  auditLog: AuditLog
  messageXml: string
}

export interface ValidationResult {
  isValid: boolean
  message?: string
}

interface StoreMessageValidationResult {
  s3ValidationResult?: ValidationResult
  messageHashValidationResult?: ValidationResult
}

const s3Gateway = new AwsS3Gateway(createS3Config())
const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())

export default async function storeMessage(
  event: S3PutObjectEvent
): Promise<StoreMessageResult | StoreMessageValidationResult> {
  const receivedMessage = await retrieveMessageFromS3(event, s3Gateway)

  if (isError(receivedMessage)) {
    throw receivedMessage
  }

  if ("s3ValidationResult" in receivedMessage) {
    return receivedMessage
  }

  const formattedMessage = await formatMessage(receivedMessage)

  if (isError(formattedMessage)) {
    throw formattedMessage
  }

  const auditLog = await readMessage(formattedMessage)

  if (isError(auditLog)) {
    throw auditLog
  }

  const messageHashValidationResult = await validateMessageHash(auditLog.messageHash, apiClient)

  if (messageHashValidationResult && "messageHashValidationResult" in messageHashValidationResult) {
    return messageHashValidationResult
  }

  const createAuditLogResult = await apiClient.createAuditLog(auditLog)

  if (isError(createAuditLogResult)) {
    throw createAuditLogResult
  }

  return { auditLog, messageXml: formattedMessage.messageXml }
}
