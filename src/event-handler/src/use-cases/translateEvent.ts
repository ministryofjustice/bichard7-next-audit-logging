import { isError } from "shared-types"
import type { EventInput } from "src/types"
import getTranslator from "./translators/getTranslator"
import type TranslationResult from "./translators/TranslationResult"

export default async (event: EventInput): Promise<TranslationResult> => {
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
