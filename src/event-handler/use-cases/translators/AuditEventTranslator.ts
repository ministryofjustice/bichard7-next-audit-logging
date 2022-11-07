import { decodeBase64, parseXml } from "src/shared"
import type { PromiseResult } from "src/shared/types"
import type { AuditEvent, EventInput } from "../../types"
import transformEventDetails from "./transformEventDetails"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"

const AuditEventTranslator: Translator = async (input: EventInput): PromiseResult<TranslationResult> => {
  const { messageData, eventSourceArn, eventSourceQueueName } = input
  // Audit events are in base64 encoded XML
  const xml = decodeBase64(messageData)
  const logItem = await parseXml<AuditEvent>(xml)

  if (!logItem || !logItem.auditEvent) {
    return new Error("Failed to parse the Audit Event")
  }

  const event = transformEventDetails(logItem.auditEvent, xml, eventSourceArn, eventSourceQueueName)
  return {
    messageId: logItem.auditEvent.correlationID,
    event
  }
}

export default AuditEventTranslator
