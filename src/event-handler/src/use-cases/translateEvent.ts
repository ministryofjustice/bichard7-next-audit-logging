import { isError } from "shared-types"
import getTranslator from "./translators/getTranslator"
import type TranslationResult from "./translators/TranslationResult"
import type TranslateEventInput from "../types/TranslateEventInput"

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