import type { PromiseResult, AuditLogEvent } from "shared"
import { decodeBase64, parseXml } from "shared"
import type GeneralEventLogItem from "types/AuditEvent"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const GeneralEventTranslator: Translator = async (messageData: string): PromiseResult<AuditLogEvent> => {
  // General events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<GeneralEventLogItem>(xml)

  if (!logItem || !logItem.logEvent) {
    return new Error("Failed to parse the General Event")
  }

  return transformEventDetails(logItem.logEvent)
}

export default GeneralEventTranslator
