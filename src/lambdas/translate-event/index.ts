import { EventMessage, isError, MessageFormat } from "shared"
import getTranslator from "translators/getTranslator"
import type TranslationResult from "translators/TranslationResult"

interface TranslateEventInput extends EventMessage {
  s3Path: string
}

interface TranslateEventResult {
  result: TranslationResult
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
    result: translationResult
  }
}
