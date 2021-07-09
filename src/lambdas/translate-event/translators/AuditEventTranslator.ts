import type { AuditLogEvent, PromiseResult } from "shared"
import type Translator from "./Translator"

const AuditEventTranslator: Translator = async (messageData: string): PromiseResult<AuditLogEvent> => {
  await Promise.resolve()

  return new Error(`Not yet implemented${messageData}`)
}

export default AuditEventTranslator
