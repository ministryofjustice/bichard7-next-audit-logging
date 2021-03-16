import { ReceivedMessage } from "src/entities"
import formatMessageXml from "src/use-cases/formatMessageXml"
import { clean, hasRootElement } from "src/utils/xml"

export default async function formatMessage(event: ReceivedMessage): Promise<ReceivedMessage> {
  let formattedMessage = event.messageXml

  const hasDeliveryElement = await hasRootElement(formattedMessage, "DeliverRequest")
  if (!hasDeliveryElement) {
    formattedMessage = formatMessageXml(clean(formattedMessage))
  }

  return {
    receivedDate: event.receivedDate,
    messageXml: formattedMessage
  }
}
