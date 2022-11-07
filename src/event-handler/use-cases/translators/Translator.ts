import type { PromiseResult } from "src/shared/types"
import type { EventInput } from "../../types"
import type TranslationResult from "./TranslationResult"

type Translator = (eventInput: EventInput) => PromiseResult<TranslationResult>

export default Translator
