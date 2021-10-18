import { clean, hasRootElement } from "shared"
import type { ReceivedMessage } from "src/entities"
import formatMessageXml from "src/use-cases/formatMessageXml"

export default async function formatMessage(event: ReceivedMessage): Promise<ReceivedMessage> {
  let formattedMessage = event.messageXml

  formattedMessage = clean(formattedMessage)
  const hasRouteDataElement = await hasRootElement(formattedMessage, "RouteData")

  if (!hasRouteDataElement) {
    formattedMessage = formatMessageXml(formattedMessage)
  }

  return {
    receivedDate: event.receivedDate,
    messageXml: formattedMessage
  }
}
