import { PromiseResult } from "@handlers/common"
import { MessageData } from "src/types"
import formatMessage from "./formatMessage"
import readMessage from "./readMessage"
import { clean, hasRootElement } from "../utils/xml"

const handleMessage = async (messageBody: string): PromiseResult<MessageData> => {
  let formattedMessage = messageBody
  const hasDeliveryElement = await hasRootElement(messageBody, "DeliverRequest")

  if (!hasDeliveryElement) {
    formattedMessage = formatMessage(clean(messageBody))
  }

  return readMessage(formattedMessage)
}

export default handleMessage
