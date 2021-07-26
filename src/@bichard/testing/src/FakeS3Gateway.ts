import type { S3Gateway } from "@bichard/s3"
import type { KeyValuePair, PromiseResult } from "shared"

export default class FakeS3Gateway implements S3Gateway {
  private items: KeyValuePair<string, string> = {}

  private error?: Error

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

  shouldReturnError(error: Error): void {
    this.error = error
  }

  reset(items?: KeyValuePair<string, string>): void {
    this.error = undefined
    this.items = items ?? {}
  }
}
