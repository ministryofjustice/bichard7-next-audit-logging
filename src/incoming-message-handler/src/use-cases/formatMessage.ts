import { clean, hasRootElement } from "shared"
import type { PromiseResult } from "shared-types"
import type { ReceivedMessage } from "../entities"
import ApplicationError from "src/errors/ApplicationError"
import formatMessageXml from "./formatMessageXml"

export default async (receivedMessage: ReceivedMessage): PromiseResult<ReceivedMessage> => {
  try {
    let { messageXml } = receivedMessage
    messageXml = clean(messageXml)
    const hasRouteDataElement = await hasRootElement(messageXml, "RouteData")

    if (!hasRouteDataElement) {
      messageXml = formatMessageXml(messageXml)
    }

    return {
      ...receivedMessage,
      messageXml
    }
  } catch (error) {
    return new ApplicationError("Error while formatting the message", error as Error)
  }
}
