import type { PromiseResult, AuditLogEvent } from "shared"

type Translator = (messageData: string) => PromiseResult<AuditLogEvent>

export default Translator
