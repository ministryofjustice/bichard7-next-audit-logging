import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type CourtResultInput from "src/types/CourtResultInput"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const CourtResultInputTranslator: Translator = async (input: TranslateEventInput): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn, messageType } = input
  // Court Result Inputs are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const inputItem = await parseXml<CourtResultInput>(xml)
  // These values will probably need updating
  const logItem = {
    logEvent: {
      systemID: "Audit Logging Event Handler",
      componentID: "Translate Event",
      eventType: "error",
      eventCategory: "error",
      correlationID: inputItem.DeliverRequest.MessageIdentifier,
      eventDateTime: inputItem.DeliverRequest.MessageMetadata.CreationDateTime,
      eventSource: "COURT_RESULT_INPUT_QUEUE",
      eventSourceArn: input.eventSourceArn
    }
  }

  if (!logItem || !logItem.logEvent) {
    return new Error("Failed to parse the Court Result Input")
  }

  const event = transformEventDetails(logItem.logEvent, s3Path, eventSourceArn, messageType)
  return {
    messageId: logItem.logEvent.correlationID,
    event
  }
}

export default CourtResultInputTranslator
