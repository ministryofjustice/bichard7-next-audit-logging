import { isError, PromiseResult } from "@handlers/common"
import { MessageData } from "../entities"
import ApplicationError from "../errors/ApplicationError"
import S3Gateway from "../gateways/S3Gateway"
import getFileName from "../utils/getFileName"

export default class UploadMessageUseCase {
  constructor(private readonly gateway: S3Gateway) {}

  async save(messageData: MessageData): PromiseResult<string> {
    const { messageId, rawXml, receivedDate } = messageData
    const fileName = getFileName(receivedDate, messageId)
    const result = await this.gateway.upload(fileName, rawXml)

    if (isError(result)) {
      return new ApplicationError(`The file ${fileName} could not be saved`, result)
    }

    return fileName
  }
}
