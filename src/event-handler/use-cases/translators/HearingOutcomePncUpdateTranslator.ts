import { decodeBase64, parseXml } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import type { EventDetails, EventInput, HearingOutcomePncUpdate } from "../../types"
import transformEventDetails from "./transformEventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"

const HearingOutcomePncUpdateTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceQueueName } = input
  // Hearing Outcome PNC Updates are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const inputItem = await parseXml<HearingOutcomePncUpdate>(xml)

  if (!inputItem) {
    return new Error("Failed to parse the Hearing Outcome PNC Update")
  }

  const logItem: EventDetails = {
    systemID: "Audit Logging Event Handler",
    componentID: "Translate Event",
    eventType: "Hearing Outcome PNC Update Queue Failure",
    eventCategory: "error",
    correlationID: inputItem.AnnotatedHearingOutcome.HearingOutcome.Hearing.SourceReference.UniqueID,
    eventDateTime: new Date().toISOString()
  }
  const event = transformEventDetails(logItem, xml, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default HearingOutcomePncUpdateTranslator
