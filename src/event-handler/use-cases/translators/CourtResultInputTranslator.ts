import { decodeBase64, parseXml } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import type { CourtResultInput, EventDetails, EventInput } from "../../types"
import transformEventDetails from "./transformEventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"

const CourtResultInputTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceArn, eventSourceQueueName } = input
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
  const event = transformEventDetails(logItem, xml, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default CourtResultInputTranslator
