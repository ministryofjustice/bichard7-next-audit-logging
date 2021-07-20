import type { PromiseResult } from "shared"
import { decodeBase64, parseXml } from "shared"
import type { AuditEvent } from "src/types"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const AuditEventTranslator: Translator = async ({
  messageData,
  s3Path,
  eventSourceArn
}: TranslateEventInput): PromiseResult<TranslationResult> => {
  // Audit events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<AuditEvent>(xml)

  if (!logItem || !logItem.auditEvent) {
    return new Error("Failed to parse the Audit Event")
  }

  const event = transformEventDetails(logItem.auditEvent, s3Path, eventSourceArn)
  return {
    messageId: logItem.auditEvent.correlationID,
    event
  }
}

export default AuditEventTranslator
