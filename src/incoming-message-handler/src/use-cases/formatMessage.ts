import { clean, hasRootElement } from "shared"
import type { PromiseResult } from "shared-types"
import type { ReceivedMessage } from "../entities"
import ApplicationError from "src/errors/ApplicationError"
import formatMessageXml from "./formatMessageXml"
import crypto from "crypto"

const generateHash = (text: string) => crypto.createHash("sha256").update(text, "utf-8").digest("hex")

const getInnerMessage = (xml: string) =>
  xml.match(/<(?:[\S]*:)?DataStreamContent>(?<innerMessage>[\s\S]*)<\/(?:[\S]*:)?DataStreamContent>/)?.groups
    ?.innerMessage

export default async (receivedMessage: ReceivedMessage): PromiseResult<ReceivedMessage> => {
  try {
    let { messageXml } = receivedMessage
    messageXml = clean(messageXml)
    const hasRouteDataElement = await hasRootElement(messageXml, "RouteData")

    let hash: string
    if (!hasRouteDataElement) {
      hash = generateHash(messageXml)
      messageXml = formatMessageXml(messageXml)
    } else {
      const innerXml = getInnerMessage(messageXml)
      hash = generateHash(innerXml ?? messageXml)
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
