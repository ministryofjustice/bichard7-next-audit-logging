import { decodeBase64, parseXml } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import type { EventInput, GeneralEventLogItem } from "../../types"
import transformEventDetails from "./transformEventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"

const GeneralEventTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceArn, eventSourceQueueName } = input
  // General events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<GeneralEventLogItem>(xml)

  if (!logItem || !logItem.logEvent) {
    return new Error("Failed to parse the General Event")
  }

  const event = transformEventDetails(logItem.logEvent, xml, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.logEvent.correlationID,
    event
  }
}

export default GeneralEventTranslator
