import { isError, PromiseResult } from "@handlers/common"
import { clean, hasRootElement } from "../utils/xml"
import IncomingMessage from "../entities/IncomingMessage"
import formatMessage from "./formatMessage"
import readMessage from "./readMessage"
import PersistMessageUseCase from "./PersistMessageUseCase"
import UploadMessageUseCase from "./UploadMessageUseCase"
import SendMessageUseCase from "./SendMessageUseCase"

export default class HandleMessageUseCase {
  constructor(
    private readonly persistMessage: PersistMessageUseCase,
    private readonly uploadMessage: UploadMessageUseCase,
    private readonly sendMessage: SendMessageUseCase
  ) {}

  async handle(messageBody: string): PromiseResult<void> {
    let formattedMessage = messageBody

    const hasDeliveryElement = await hasRootElement(messageBody, "DeliverRequest")
    if (!hasDeliveryElement) {
      formattedMessage = formatMessage(clean(messageBody))
    }

    const messageData = await readMessage(formattedMessage)
    if (isError(messageData)) {
      return messageData
    }

    const uploadResult = await this.uploadMessage.save(messageData)
    if (isError(uploadResult)) {
      throw uploadResult
    }

    const incomingMessage = new IncomingMessage(messageData.messageId, new Date())
    const persistMessageResult = await this.persistMessage.persist(incomingMessage)

    if (isError(persistMessageResult)) {
      return persistMessageResult
    }

    const sendMessageResult = await this.sendMessage.send(messageData.rawXml)
    if (isError(sendMessageResult)) {
      return sendMessageResult
    }

    return undefined
  }
}
