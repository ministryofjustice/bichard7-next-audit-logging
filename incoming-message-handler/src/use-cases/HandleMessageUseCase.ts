import { PromiseResult } from "@handlers/common"
import { clean, hasRootElement } from "../utils/xml"
import formatMessage from "./formatMessageXml"

export default class HandleMessageUseCase {
  async handle(messageBody: string): PromiseResult<string> {
    console.log(this)

    let formattedMessage = messageBody

    const hasDeliveryElement = await hasRootElement(messageBody, "DeliverRequest")
    if (!hasDeliveryElement) {
      formattedMessage = formatMessage(clean(messageBody))
    }

    return formattedMessage
  }
}
