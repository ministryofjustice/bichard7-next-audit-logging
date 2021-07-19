import type { EventMessage } from "shared"
import { isError } from "shared"
import getTranslator from "src/translators/getTranslator"
import type TranslationResult from "src/translators/TranslationResult"

export interface TranslateEventInput extends EventMessage {
  s3Path: string
}

export default async (event: TranslateEventInput): Promise<TranslationResult> => {
  const translator = getTranslator(event.messageFormat)
  if (isError(translator)) {
    throw translator
  }

  const translationResult = await translator(event)

  if (isError(translationResult)) {
    throw translationResult
  }

  return translationResult
}
