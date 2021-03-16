import { isError, PromiseResult } from "@handlers/common"
import { clean, hasRootElement } from "../utils/xml"
import { IncomingMessage } from "../entities"
import formatMessage from "./formatMessage"
import readMessage from "./readMessage"

export default class HandleMessageUseCase {
  async handle(messageBody: string): PromiseResult<IncomingMessage> {
    console.log(this)

    let formattedMessage = messageBody

    const hasDeliveryElement = await hasRootElement(messageBody, "DeliverRequest")
    if (!hasDeliveryElement) {
      formattedMessage = formatMessage(clean(messageBody))
    }

    const messageData = await readMessage(formattedMessage)
    if (isError(messageData)) {
      return messageData
    }

    const incomingMessage = new IncomingMessage(messageData.messageId, new Date(), messageData.rawXml)
    return incomingMessage
  }
}
