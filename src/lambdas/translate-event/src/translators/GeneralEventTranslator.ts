import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type GeneralEventLogItem from "src/types/GeneralEventLogItem"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const GeneralEventTranslator: Translator = async (input: TranslateEventInput): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn } = input
  // General events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<GeneralEventLogItem>(xml)

  if (!logItem || !logItem.logEvent) {
    return new Error("Failed to parse the General Event")
  }

  const event = transformEventDetails(logItem.logEvent, s3Path, eventSourceArn)
  return {
    messageId: logItem.logEvent.correlationID,
    event
  }
}

export default GeneralEventTranslator
