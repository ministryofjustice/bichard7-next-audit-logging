import type { S3GatewayInterface, PromiseResult } from "shared-types"

export default class DeleteEventXmlFromS3UseCase {
  constructor(private readonly gateway: S3GatewayInterface) {}

  call(s3Path: string): PromiseResult<void> {
    return this.gateway.deleteItem(s3Path)
  }
}
