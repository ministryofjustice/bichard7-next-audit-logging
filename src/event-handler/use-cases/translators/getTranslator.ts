import type { MessageFormat, Result } from "src/shared/types"
import AuditEventTranslator from "./AuditEventTranslator"
import CourtResultInputTranslator from "./CourtResultInputTranslator"
import DataSetPncUpdateTranslator from "./DataSetPncUpdateTranslator"
import GeneralEventTranslator from "./GeneralEventTranslator"
import HearingOutcomeInputTranslator from "./HearingOutcomeInputTranslator"
import HearingOutcomePncUpdateTranslator from "./HearingOutcomePncUpdateTranslator"
import PncUpdateRequestTranslator from "./PncUpdateRequestTranslator"
import type Translator from "./Translator"

export default (messageFormat: MessageFormat): Result<Translator> => {
  switch (messageFormat) {
    case "AuditEvent":
      return AuditEventTranslator

    case "GeneralEvent":
      return GeneralEventTranslator

    case "CourtResultInput":
      return CourtResultInputTranslator

    case "HearingOutcomePncUpdate":
      return HearingOutcomePncUpdateTranslator

    case "DataSetPncUpdate":
      return DataSetPncUpdateTranslator

    case "HearingOutcomeInput":
      return HearingOutcomeInputTranslator

    case "PncUpdateRequest":
      return PncUpdateRequestTranslator

    default:
      return new Error(`Unsupported message format: ${messageFormat}`)
  }
}
