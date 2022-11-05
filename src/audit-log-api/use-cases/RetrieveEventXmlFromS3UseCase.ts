import type { PromiseResult, S3GatewayInterface } from "src/shared/types"

export default class RetrieveEventXmlFromS3UseCase {
  constructor(private readonly gateway: S3GatewayInterface) {}

  retrieve(s3Path: string): PromiseResult<string> {
    return this.gateway.getItem(s3Path)
  }
}
