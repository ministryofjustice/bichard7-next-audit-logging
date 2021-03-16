import formatMessageXml from "./use-cases/formatMessageXml"
import { clean, hasRootElement } from "./utils/xml"

export default async function formatMessage(event: string): Promise<string> {
  let formattedMessage = event

  const hasDeliveryElement = await hasRootElement(formattedMessage, "DeliverRequest")
  if (!hasDeliveryElement) {
    formattedMessage = formatMessageXml(clean(formattedMessage))
  }

  return formattedMessage
}
