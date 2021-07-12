import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import type { AuditEvent } from "../types"
import transformEventDetails from "./transformEventDetails"

const AuditEventTranslator: Translator = async (messageData: string): PromiseResult<TranslationResult> => {
  // Audit events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<AuditEvent>(xml)

  if (!logItem || !logItem.auditEvent) {
    return new Error("Failed to parse the Audit Event")
  }

  const event = transformEventDetails(logItem.auditEvent)
  return {
    messageId: logItem.auditEvent.correlationID,
    event
  }
}

export default AuditEventTranslator
