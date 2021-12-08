import type { S3 } from "aws-sdk"
import type { PromiseResult } from "shared"

export default interface S3Gateway {
  forBucket(bucketName: string): S3Gateway
  getBucketName(): string
  getItem(key: string): PromiseResult<string>
  upload<T>(fileName: string, content: T): PromiseResult<void>
  list(): PromiseResult<S3.ObjectList>
  copyItemTo(key: string, destinationBucketName: string): PromiseResult<void>
  deleteItem(key: string): PromiseResult<void>
}
