import type { S3PutObjectEvent, PromiseResult, S3GatewayInterface } from "shared-types"

export default class DoesS3ObjectExist {
  constructor(private s3Gateway: S3GatewayInterface) {}

  execute(event: S3PutObjectEvent): PromiseResult<boolean> {
    const { bucketName, key } = event.detail.requestParameters

    return this.s3Gateway.forBucket(bucketName).doesItemExist(key)
  }
}
