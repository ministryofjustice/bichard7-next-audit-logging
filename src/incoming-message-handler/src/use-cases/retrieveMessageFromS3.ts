import path from "path"
import type { S3PutObjectEvent, PromiseResult, S3GatewayInterface } from "shared-types"
import { isError } from "shared-types"
import type { ReceivedMessage } from "../entities"
import { ApplicationError } from "shared-types"
import type { ValidationResult } from "../handlers/storeMessage"
import readReceivedDateFromS3ObjectKey from "../utils/readReceivedDateFromS3ObjectKey"
import validateS3Key from "./validateS3Key"

export default async (
  event: S3PutObjectEvent,
  s3Gateway: S3GatewayInterface
): PromiseResult<ReceivedMessage | ValidationResult> => {
  const { bucketName, key } = event.detail.requestParameters

  const externalId = path.basename(key).replace(".xml", "")

  const validationResult = validateS3Key(key)
  if (!validationResult.isValid) {
    return validationResult
  }

  const messageXml = await s3Gateway.forBucket(bucketName).getItem(key)

  if (isError(messageXml)) {
    return new ApplicationError("Error while getting the message from S3", messageXml)
  }

  try {
    const receivedDate = readReceivedDateFromS3ObjectKey(key)

    return {
      s3Path: key,
      externalId,
      stepExecutionId: event.id,
      receivedDate: receivedDate.toISOString(),
      messageXml
    }
  } catch (error) {
    return new Error("Error while reading the message received date")
  }
}
