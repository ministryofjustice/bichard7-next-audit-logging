import type { PromiseResult } from "shared-types"
import { decodeBase64, parseXml } from "shared"
import type CourtResultInput from "../types/CourtResultInput"
import type TranslateEventInput from "../TranslateEventInput"
import type EventDetails from "../types/EventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const CourtResultInputTranslator: Translator = async (input: TranslateEventInput): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn, eventSourceQueueName } = input
  // Court Result Inputs are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const inputItem = await parseXml<CourtResultInput>(xml)

  if (!inputItem) {
    return new Error("Failed to parse the Court Result Input")
  }

  const logItem: EventDetails = {
    systemID: "Audit Logging Event Handler",
    componentID: "Translate Event",
    eventType: "Court Result Input Queue Failure",
    eventCategory: "error",
    correlationID: inputItem.DeliverRequest.MessageIdentifier,
    eventDateTime: new Date().toISOString()
  }
  const event = transformEventDetails(logItem, s3Path, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default CourtResultInputTranslator
