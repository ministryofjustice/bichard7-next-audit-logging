import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type EventDetails from "src/types/EventDetails"
import type HearingOutcomeInput from "src/types/HearingOutcomeInput"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const HearingOutcomeInputTranslator: Translator = async (
  input: TranslateEventInput
): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn, eventSourceQueueName } = input
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
    correlationID: inputItem.AnnotatedHearingOutcome.HearingOutcome.Hearing.SourceReference.UniqueID,
    eventDateTime: new Date().toISOString()
  }
  const event = transformEventDetails(logItem, s3Path, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default HearingOutcomeInputTranslator
