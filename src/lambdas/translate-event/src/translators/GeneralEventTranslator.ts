import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type GeneralEventLogItem from "src/types/GeneralEventLogItem"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const GeneralEventTranslator: Translator = async (messageData: string): PromiseResult<TranslationResult> => {
  // General events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<GeneralEventLogItem>(xml)

  if (!logItem || !logItem.logEvent) {
    return new Error("Failed to parse the General Event")
  }

  const event = transformEventDetails(logItem.logEvent)
  return {
    messageId: logItem.logEvent.correlationID,
    event
  }
}

export default GeneralEventTranslator
