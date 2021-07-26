import type { PromiseResult } from "shared"

export default interface S3Gateway {
  getItem(key: string): PromiseResult<string>
  upload<T>(fileName: string, content: T): PromiseResult<void>
}
