import type { PromiseResult } from "shared"
import type { S3Gateway } from "@bichard/s3"

export default class RetrieveEventXmlFromS3UseCase {
  constructor(private readonly gateway: S3Gateway) {}

  retrieve(s3Path: string): PromiseResult<string> {
    return this.gateway.getItem(s3Path)
  }
}
