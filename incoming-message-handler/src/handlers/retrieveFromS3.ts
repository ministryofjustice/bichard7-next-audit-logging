import type { S3PutObjectEvent } from "shared"
import { isError, S3Gateway } from "shared"
import { createS3Config } from "src/configs"
import type { ReceivedMessage } from "src/entities"
import type { ValidateS3KeyResult } from "src/use-cases/validateS3Key"
import validateS3Key from "src/use-cases/validateS3Key"
import readReceivedDateFromS3ObjectKey from "src/utils/readReceivedDateFromS3ObjectKey"
import path from "path"

interface ValidationResult {
  validationResult: ValidateS3KeyResult
}

const s3Gateway = new S3Gateway(createS3Config())

export default async function retrieveFromS3(event: S3PutObjectEvent): Promise<ReceivedMessage | ValidationResult> {
  const { bucketName, key } = event.detail.requestParameters

  const externalId = path.basename(key).replace(".xml", "")

  const validationResult = validateS3Key(key)
  if (!validationResult.isValid) {
    return { validationResult }
  }

  const messageXml = await s3Gateway.getItem(bucketName, key)

  if (isError(messageXml)) {
    throw messageXml
  }

  const receivedDate = readReceivedDateFromS3ObjectKey(key)

  return {
    s3Path: key,
    externalId,
    stepExecutionId: event.id,
    receivedDate: receivedDate.toISOString(),
    messageXml
  }
}
