import type { PromiseResult } from "shared-types"
import { decodeBase64, parseXml } from "shared"
import type { AuditEvent } from "../../types"
import type { EventInput } from "../../types"
import type TranslationResult from "./TranslationResult"
import type Translator from "./Translator"
import transformEventDetails from "./transformEventDetails"

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
