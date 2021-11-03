import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type EventDetails from "src/types/EventDetails"
import type { PncUpdateRequest } from "src/types"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const PncUpdateRequestTranslator: Translator = async (input: TranslateEventInput): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn, eventSourceQueueName } = input
  // Data Set PNC Update Inputs are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const inputItem = await parseXml<PncUpdateRequest>(xml)

  if (!inputItem) {
    return new Error("Failed to parse the PNC Update Request")
  }

  const logItem: EventDetails = {
    systemID: "Audit Logging Event Handler",
    componentID: "Translate Event",
    eventType: "PNC Update Request Queue Failure",
    eventCategory: "error",
    correlationID: inputItem.PNCUpdateDataset.AnnotatedHearingOutcome.HearingOutcome.Hearing.SourceReference.UniqueID,
    eventDateTime: new Date().toISOString()
  }
  const event = transformEventDetails(logItem, s3Path, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default PncUpdateRequestTranslator