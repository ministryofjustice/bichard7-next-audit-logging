import type { PromiseResult, S3GatewayInterface, S3PutObjectEvent } from "src/shared/types"
import { isError } from "src/shared/types"
import type { EventInput } from "../types"

export default class RetrieveEventFromS3UseCase {
  constructor(private s3Gateway: S3GatewayInterface) {}

  async execute(event: S3PutObjectEvent): PromiseResult<EventInput> {
    const { bucketName, key } = event.detail.requestParameters

    const messageData = await this.s3Gateway.forBucket(bucketName).getItem(key)

    if (isError(messageData)) {
      return messageData
    }

    const message = JSON.parse(messageData)

    return {
      ...message,
      s3Path: key
    }
  }
}
