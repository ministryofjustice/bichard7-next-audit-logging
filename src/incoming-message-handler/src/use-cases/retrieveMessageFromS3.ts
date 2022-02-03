import path from "path"
import { hasRootElement } from "shared"
import { clean } from "shared"
import type { S3PutObjectEvent, PromiseResult, S3GatewayInterface } from "shared-types"
import { isError } from "shared-types"
import type { ReceivedMessage } from "src/entities"
import ApplicationError from "src/errors/ApplicationError"
import readReceivedDateFromS3ObjectKey from "src/utils/readReceivedDateFromS3ObjectKey"
import formatMessageXml from "./formatMessageXml"
import type { ValidateS3KeyResult } from "./validateS3Key"
import validateS3Key from "./validateS3Key"

export interface ValidationResult {
  validationResult: ValidateS3KeyResult
}

export default async (
  event: S3PutObjectEvent,
  s3Gateway: S3GatewayInterface
): PromiseResult<ReceivedMessage | ValidationResult> => {
  const { bucketName, key } = event.detail.requestParameters

  const externalId = path.basename(key).replace(".xml", "")

  const validationResult = validateS3Key(key)
  if (!validationResult.isValid) {
    return { validationResult }
  }

  let messageXml = await s3Gateway.forBucket(bucketName).getItem(key)

  if (isError(messageXml)) {
    return new ApplicationError("Error while getting the message from S3", messageXml)
  }

  try {
    messageXml = clean(messageXml)
    const hasRouteDataElement = await hasRootElement(messageXml, "RouteData")

    if (!hasRouteDataElement) {
      messageXml = formatMessageXml(messageXml)
    }

    const receivedDate = readReceivedDateFromS3ObjectKey(key)

    return {
      s3Path: key,
      externalId,
      stepExecutionId: event.id,
      receivedDate: receivedDate.toISOString(),
      messageXml
    }
  } catch (error) {
    return new ApplicationError("Error while formatting the message", error as Error)
  }
}
