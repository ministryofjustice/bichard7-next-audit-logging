import { isError } from "shared-types"
import type { S3PutObjectEvent, PromiseResult, S3GatewayInterface } from "shared-types"
import type { EventInput } from "src/types"

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
