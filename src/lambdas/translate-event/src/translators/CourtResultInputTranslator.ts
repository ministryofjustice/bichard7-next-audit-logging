import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type CourtResultInput from "src/types/CourtResultInput"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const CourtResultInputTranslator: Translator = async (input: TranslateEventInput): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn } = input
  // Court Result Inputs are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const inputItem = await parseXml<CourtResultInput>(xml)
  // These values will probably need updating
  const logItem = {
    logEvent: {
      systemID: inputItem.DeliverRequest.MessageIdentifier,
      componentID:
        inputItem.DeliverRequest.RequestingSystem.Name + inputItem.DeliverRequest.RequestingSystem.OrgUnitCode,
      eventType: "SPIResults",
      eventCategory: "SPIResults",
      correlationID: inputItem.DeliverRequest.MessageMetadata.SenderRequestedDestination,
      eventDateTime: inputItem.DeliverRequest.MessageMetadata.CreationDateTime,
      eventSource:
        inputItem.DeliverRequest.RequestingSystem.OrgUnitCode + inputItem.DeliverRequest.RequestingSystem.Environment,
      eventSourceArn: "DummyArn"
    }
  }

  if (!logItem || !logItem.logEvent) {
    return new Error("Failed to parse the Court Result Input")
  }

  const event = transformEventDetails(logItem.logEvent, s3Path, eventSourceArn)
  return {
    messageId: logItem.logEvent.correlationID,
    event
  }
}

export default CourtResultInputTranslator
