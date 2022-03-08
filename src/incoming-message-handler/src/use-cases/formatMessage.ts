import { clean, hasRootElement } from "shared"
import type { PromiseResult } from "shared-types"
import type { ReceivedMessage } from "../entities"
import { ApplicationError } from "shared-types"
import formatMessageXml from "./formatMessageXml"
import crypto from "crypto"
import getDataStreamContent from "./getDataStreamContent"

const generateHash = (text: string) => crypto.createHash("sha256").update(text, "utf-8").digest("hex")

export default async (receivedMessage: ReceivedMessage): PromiseResult<ReceivedMessage> => {
  try {
    let { messageXml } = receivedMessage
    messageXml = clean(messageXml)
    const hasRouteDataElement = await hasRootElement(messageXml, "RouteData")

    let hash: string
    if (!hasRouteDataElement) {
      hash = generateHash(messageXml.trim())
      messageXml = formatMessageXml(messageXml)
    } else {
      const innerXml = getDataStreamContent(messageXml)
      hash = generateHash(innerXml ?? messageXml.trim())
    }

    return {
      ...receivedMessage,
      messageXml,
      hash
    }
  } catch (error) {
    return new ApplicationError("Error while formatting the message", error as Error)
  }
}
