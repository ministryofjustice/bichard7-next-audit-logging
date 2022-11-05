import { decodeBase64, parseXml } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import type { EventDetails, EventInput, HearingOutcomeInput } from "../../types"
import transformEventDetails from "./transformEventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"

const HearingOutcomeInputTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceArn, eventSourceQueueName } = input
  // Hearing Outcome Inputs are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const inputItem = await parseXml<HearingOutcomeInput>(xml)

  if (!inputItem) {
    return new Error("Failed to parse the Hearing Outcome Input")
  }

  const logItem: EventDetails = {
    systemID: "Audit Logging Event Handler",
    componentID: "Translate Event",
    eventType: "Hearing Outcome Input Queue Failure",
    eventCategory: "error",
    correlationID: inputItem.HearingOutcome.Hearing.SourceReference.UniqueID,
    eventDateTime: new Date().toISOString()
  }
  const event = transformEventDetails(logItem, xml, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default HearingOutcomeInputTranslator
