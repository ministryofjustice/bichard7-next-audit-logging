import type { S3 } from "aws-sdk"
import type { PromiseResult } from "."

export default interface S3GatewayInterface {
  forBucket(bucketName: string): S3GatewayInterface
  getBucketName(): string
  getItem(key: string): PromiseResult<string>
  upload<T>(fileName: string, content: T): PromiseResult<void>
  list(): PromiseResult<S3.ObjectList>
  copyItemTo(key: string, destinationBucketName: string): PromiseResult<void>
  deleteItem(key: string): PromiseResult<void>
  deleteVersionedItem(key: string): PromiseResult<void>
}
