import type { PromiseResult } from "shared-types"
import { decodeBase64, parseXml } from "shared"
import type { AuditEvent } from "../types"
import type TranslateEventInput from "../TranslateEventInput"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

const AuditEventTranslator: Translator = async (input: TranslateEventInput): PromiseResult<TranslationResult> => {
  const { messageData, s3Path, eventSourceArn, eventSourceQueueName } = input
  // Audit events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<AuditEvent>(xml)

  if (!logItem || !logItem.auditEvent) {
    return new Error("Failed to parse the Audit Event")
  }

  const event = transformEventDetails(logItem.auditEvent, s3Path, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.auditEvent.correlationID,
    event
  }
}

export default AuditEventTranslator
