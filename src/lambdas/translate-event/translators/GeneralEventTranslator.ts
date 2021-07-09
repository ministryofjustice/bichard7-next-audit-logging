import type { PromiseResult, AuditLogEvent } from "shared"
import type Translator from "./Translator"

const GeneralEventTranslator: Translator = async (messageData: string): PromiseResult<AuditLogEvent> => {
  await Promise.resolve()

  return new Error(`Not yet implemented${messageData}`)
}

export default GeneralEventTranslator
