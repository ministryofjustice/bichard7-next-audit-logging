import type { AuditLog, S3PutObjectEvent } from "shared-types"
import { AuditLogApiClient, AwsS3Gateway, createS3Config } from "shared"
import { isError } from "shared-types"
import readMessage from "src/use-cases/readMessage"
import { getApiKey, getApiUrl } from "src/configs"
import type { ValidationResult } from "src/use-cases/retrieveMessageFromS3"
import retrieveMessageFromS3 from "src/use-cases/retrieveMessageFromS3"

const s3Gateway = new AwsS3Gateway(createS3Config())
const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())

export default async function storeMessage(event: S3PutObjectEvent): Promise<AuditLog | ValidationResult> {
  const receivedMessage = await retrieveMessageFromS3(event, s3Gateway)

  if (isError(receivedMessage)) {
    throw receivedMessage
  }

  if ("validationResult" in receivedMessage) {
    return { validationResult: receivedMessage.validationResult }
  }

  const auditLog = await readMessage(receivedMessage)

  if (isError(auditLog)) {
    throw auditLog
  }

  const createAuditLogResult = await apiClient.createAuditLog(auditLog)

  if (isError(createAuditLogResult)) {
    throw createAuditLogResult
  }

  return auditLog
}
