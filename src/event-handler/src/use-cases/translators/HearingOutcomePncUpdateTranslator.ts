import type { PromiseResult } from "shared-types"
import { decodeBase64, parseXml } from "shared"
import type { EventInput, HearingOutcomePncUpdate, EventDetails } from "../../types"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const HearingOutcomePncUpdateTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceArn, eventSourceQueueName } = input
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
  const event = transformEventDetails(logItem, xml, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default HearingOutcomePncUpdateTranslator
