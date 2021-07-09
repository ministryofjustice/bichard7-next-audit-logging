import type { EventMessage, MessageFormat, AuditLogEvent } from "shared"
import { isError } from "shared"
import getTranslator from "translators/getTranslator"

interface TranslateEventInput extends EventMessage {
  s3Path: string
}

interface TranslateEventResult {
  event: AuditLogEvent
  messageFormat: MessageFormat
  s3Path: string
}

export default async (event: TranslateEventInput): Promise<TranslateEventResult> => {
  const translator = getTranslator(event.messageFormat)
  if (isError(translator)) {
    throw translator
  }

  const translationResult = await translator(event.messageData)
  if (isError(translationResult)) {
    throw translationResult
  }

  return {
    messageFormat: event.messageFormat,
    s3Path: event.s3Path,
    event: translationResult
  }
}
