/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-prototype-builtins */
import type { S3Gateway } from "@bichard/s3"
import type { KeyValuePair, PromiseResult } from "shared"

export default class FakeS3Gateway implements S3Gateway {
  private items: KeyValuePair<string, string> = {}

  private error?: Error

  getItem(key: string): PromiseResult<string> {
    if (this.error) {
      return Promise.resolve(this.error)
    }

    if (!this.items.hasOwnProperty(key)) {
      return Promise.resolve(new Error(`No item with key '${key}' found in the S3 bucket.`))
    }

    return Promise.resolve(this.items[key])
  }

  // @ts-ignore
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
