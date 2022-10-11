import type { S3 } from "aws-sdk"
import type { PromiseResult } from "."

export default interface S3GatewayInterface {
  forBucket(bucketName: string): S3GatewayInterface
  getBucketName(): string
  getItem(key: string): PromiseResult<string>
  doesItemExist(key: string): PromiseResult<boolean>
  upload(fileName: string, content: string): PromiseResult<void>
  list(): PromiseResult<S3.ObjectList>
  copyItemTo(key: string, destinationBucketName: string): PromiseResult<void>
  deleteItem(key: string): PromiseResult<void>
}
