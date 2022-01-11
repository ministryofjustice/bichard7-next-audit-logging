import type { PromiseResult } from "shared-types"
import type TranslateEventInput from "../TranslateEventInput"
import type TranslationResult from "./TranslationResult"

type Translator = (eventInput: TranslateEventInput) => PromiseResult<TranslationResult>

export default Translator
