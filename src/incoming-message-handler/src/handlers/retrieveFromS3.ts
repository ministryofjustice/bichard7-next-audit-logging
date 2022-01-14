import type { S3PutObjectEvent } from "shared-types"
import { S3Gateway, createS3Config } from "shared"
import { isError } from "shared-types"
import type { ReceivedMessage } from "../entities"
import type { ValidateS3KeyResult } from "../use-cases/validateS3Key"
import validateS3Key from "../use-cases/validateS3Key"
import readReceivedDateFromS3ObjectKey from "../utils/readReceivedDateFromS3ObjectKey"
import path from "path"

interface ValidationResult {
  validationResult: ValidateS3KeyResult
}

const s3Gateway = new S3Gateway(createS3Config("INCOMING_MESSAGE_BUCKET_NAME"))

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
