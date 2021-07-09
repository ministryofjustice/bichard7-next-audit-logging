import type { PromiseResult } from "shared"
import type Translator from "./Translator"
import type TranslationResult from "./TranslationResult"

const GeneralEventTranslator: Translator = async (messageData: string): PromiseResult<TranslationResult> => {
  await Promise.resolve()

  return new Error(`Not yet implemented${messageData}`)
}

export default GeneralEventTranslator
