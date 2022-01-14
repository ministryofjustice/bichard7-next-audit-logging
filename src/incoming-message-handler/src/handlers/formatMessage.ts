import { clean, hasRootElement } from "shared"
import type { ReceivedMessage } from "../entities"
import formatMessageXml from "../use-cases/formatMessageXml"

export default async function formatMessage(event: ReceivedMessage): Promise<ReceivedMessage> {
  let formattedMessage = event.messageXml

  formattedMessage = clean(formattedMessage)
  const hasRouteDataElement = await hasRootElement(formattedMessage, "RouteData")

  if (!hasRouteDataElement) {
    formattedMessage = formatMessageXml(formattedMessage)
  }

  return {
    s3Path: event.s3Path,
    externalId: event.externalId,
    stepExecutionId: event.stepExecutionId,
    receivedDate: event.receivedDate,
    messageXml: formattedMessage
  }
}
