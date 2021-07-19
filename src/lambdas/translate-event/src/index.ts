import type { EventMessage, AuditLogEvent } from "shared"
import { isError } from "shared"
import getTranslator from "src/translators/getTranslator"

export interface TranslateEventInput extends EventMessage {
  s3Path: string
}

export interface TranslateEventResult {
  messageId: string
  event: AuditLogEvent
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
    ...translationResult,
    s3Path: event.s3Path
  }
}