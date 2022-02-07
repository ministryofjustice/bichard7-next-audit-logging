import type { AuditLog, S3PutObjectEvent } from "shared-types"
import { AuditLogApiClient, AwsS3Gateway, createS3Config } from "shared"
import { isError } from "shared-types"
import readMessage from "../use-cases/readMessage"
import { getApiKey, getApiUrl } from "../configs"
import type { ValidationResult } from "../use-cases/retrieveMessageFromS3"
import retrieveMessageFromS3 from "../use-cases/retrieveMessageFromS3"
import formatMessage from "../use-cases/formatMessage"

const s3Gateway = new AwsS3Gateway(createS3Config())
const apiClient = new AuditLogApiClient(getApiUrl(), getApiKey())

export default async function storeMessage(event: S3PutObjectEvent): Promise<AuditLog | ValidationResult> {
  const receivedMessage = await retrieveMessageFromS3(event, s3Gateway)

  if (isError(receivedMessage)) {
    throw receivedMessage
  }

  if ("validationResult" in receivedMessage) {
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

  const createAuditLogResult = await apiClient.createAuditLog(auditLog)

  if (isError(createAuditLogResult)) {
    throw createAuditLogResult
  }

  return auditLog
}
