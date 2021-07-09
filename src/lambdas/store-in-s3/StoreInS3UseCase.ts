import { v4 as uuid } from "uuid"
import { S3Gateway, EventMessage, PromiseResult, isError, MessageFormat } from "shared"

export type StoreInS3Result = {
  s3Path: string
}

export default class StoreInS3UseCase {
  constructor(private readonly gateway: S3Gateway) {}

  async execute(message: EventMessage): PromiseResult<StoreInS3Result> {
    const filename = StoreInS3UseCase.getMessageFilename(message.messageFormat)

    const result = await this.gateway.upload(filename, message.messageData)
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
    const month = now.getMonth()
    const day = now.getDay()
    const hour = now.getHours()
    const minute = now.getMinutes()

    return `${year}/${month}/${day}/${hour}/${minute}/${messageFormat}-${uuid()}.xml`
  }
}
