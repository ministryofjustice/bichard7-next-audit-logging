import type { PromiseResult } from "shared"
import type TranslateEventInput from "src/TranslateEventInput"
import type TranslationResult from "./TranslationResult"

type Translator = (eventInput: TranslateEventInput) => PromiseResult<TranslationResult>

export default Translator
