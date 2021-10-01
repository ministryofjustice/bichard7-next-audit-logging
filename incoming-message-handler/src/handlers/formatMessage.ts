import { clean, hasRootElement } from "shared"
import type { ReceivedMessage } from "src/entities"
import formatMessageXml from "src/use-cases/formatMessageXml"

export default async function formatMessage(event: ReceivedMessage): Promise<ReceivedMessage> {
  let formattedMessage = event.messageXml

  formattedMessage = formattedMessage.replace(/&lt;/g, "<")
  formattedMessage = formattedMessage.replace(/&gt;/g, ">")

  const hasDeliveryElement = await hasRootElement(formattedMessage, "RouteData")
  if (!hasDeliveryElement) {
    formattedMessage = formatMessageXml(clean(formattedMessage))
  }

  return {
    receivedDate: event.receivedDate,
    messageXml: formattedMessage
  }
}
