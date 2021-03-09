import { isError, PromiseResult } from "@handlers/common"
import S3Gateway from "../gateways/S3Gateway"
import { MessageData } from "../types"
import { getFileName } from "../utils/file"

export default class UploadMessageUseCase {
  constructor(private readonly gateway: S3Gateway) {}

  async save(messageData: MessageData): PromiseResult<string> {
    const { messageId, rawXml, receivedDate } = messageData
    const fileName = getFileName(receivedDate, messageId)
    const result = await this.gateway.upload(fileName, rawXml)

    if (isError(result)) {
      return new Error(`The file ${fileName} could not be saved`)
    }

    return fileName
  }
}
