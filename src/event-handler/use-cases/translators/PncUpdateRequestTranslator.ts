import { decodeBase64, parseXml } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import type { EventDetails, EventInput, PncUpdateRequest } from "../../types"
import transformEventDetails from "./transformEventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"

const PncUpdateRequestTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceQueueName } = input
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
    eventCode: "failure.pnc-update-request",
    eventCategory: "error",
    correlationID: inputItem.PNCUpdateDataset.AnnotatedHearingOutcome.HearingOutcome.Hearing.SourceReference.UniqueID,
    eventDateTime: new Date().toISOString()
  }
  const event = transformEventDetails(logItem, xml, eventSourceQueueName)
  return {
    messageId: logItem.correlationID,
    event
  }
}

export default PncUpdateRequestTranslator
