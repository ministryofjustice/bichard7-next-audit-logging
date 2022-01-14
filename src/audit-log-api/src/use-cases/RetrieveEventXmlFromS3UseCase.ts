import type { S3GatewayInterface, PromiseResult } from "shared-types"

export default class RetrieveEventXmlFromS3UseCase {
  constructor(private readonly gateway: S3GatewayInterface) {}

  retrieve(s3Path: string): PromiseResult<string> {
    return this.gateway.getItem(s3Path)
  }
}
