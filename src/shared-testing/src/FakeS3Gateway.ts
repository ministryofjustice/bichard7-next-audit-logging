import type { S3 } from "aws-sdk"
import type { S3GatewayInterface } from "shared-types"
import type { KeyValuePair, PromiseResult } from "shared-types"

export default class FakeS3Gateway implements S3GatewayInterface {
  public items: KeyValuePair<string, string> = {}

  private error?: Error

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  getBucketName(): string {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  forBucket(bucketName: string): S3GatewayInterface {
    return this
  }

  getItem(key: string): PromiseResult<string> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    // eslint-disable-next-line no-prototype-builtins
    if (!this.items.hasOwnProperty(key)) {
      return Promise.resolve(new Error(`No item with key '${key}' found in the S3 bucket.`))
    }

    return Promise.resolve(this.items[key])
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  upload<T>(fileName: string, content: T): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  list(): PromiseResult<S3.ObjectList> {
    throw new Error("Method not implemented.")
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  copyItemTo(key: string, destinationBucketName: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  deleteItem(key: string): PromiseResult<void> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    if (!this.items.hasOwnProperty(key)) {
      return Promise.resolve(new Error(`No item with key '${key}' found in the S3 bucket.`))
    }

    delete this.items[key]

    return Promise.resolve(undefined)
  }

  // @ts-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, class-methods-use-this
  deleteVersionedItem(key: string): PromiseResult<void> {
    throw new Error("Method not implemented.")
  }

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(items?: KeyValuePair<string, string>): void {
    this.error = undefined
    this.items = items ?? {}
  }
}
