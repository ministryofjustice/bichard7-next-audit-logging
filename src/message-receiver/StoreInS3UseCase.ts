import type { MessageFormat, PromiseResult, S3GatewayInterface } from "src/shared/types"
import { isError } from "src/shared/types"
import { v4 as uuid } from "uuid"

export type StoreInS3Result = {
  s3Path: string
}

export default class StoreInS3UseCase {
  constructor(private readonly gateway: S3GatewayInterface) {}

  async execute(message: unknown, messageFormat: MessageFormat): PromiseResult<StoreInS3Result> {
    const filename = StoreInS3UseCase.getMessageFilename(messageFormat)

    const result = await this.gateway.upload(filename, JSON.stringify(message))
    if (isError(result)) {
      return result
    }

    return {
      s3Path: filename
    }
  }

  private static getMessageFilename(messageFormat: MessageFormat): string {
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, "0")
    const day = now.getDate().toString().padStart(2, "0")
    const hour = now.getHours().toString().padStart(2, "0")
    const minute = now.getMinutes().toString().padStart(2, "0")

    return `${year}/${month}/${day}/${hour}/${minute}/${messageFormat}-${uuid()}.json`
  }
}
