import type { MessageFormat, Result } from "shared"
import type Translator from "./Translator"
import AuditEventTranslator from "./AuditEventTranslator"
import GeneralEventTranslator from "./GeneralEventTranslator"
import CourtResultInputTranslator from "./CourtResultInputTranslator"
import HearingOutcomePNCUpdateTranslator from "./HearingOutcomePNCUpdateTranslator"

export default (messageFormat: MessageFormat): Result<Translator> => {
  switch (messageFormat) {
    case "AuditEvent":
      return AuditEventTranslator

    case "GeneralEvent":
      return GeneralEventTranslator

    case "CourtResultInput":
      return CourtResultInputTranslator

    case "HearingOutcomePNCUpdate":
      return HearingOutcomePNCUpdateTranslator

    default:
      return new Error(`Unsupported message format: ${messageFormat}`)
  }
}
