import { PromiseResult } from "shared"
import type TranslationResult from "./TranslationResult"

type Translator = (messageData: string) => PromiseResult<TranslationResult>

export default Translator
