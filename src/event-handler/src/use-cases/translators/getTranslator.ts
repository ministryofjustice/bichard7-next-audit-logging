import type { MessageFormat, Result } from "shared-types"
import type Translator from "./Translator"
import AuditEventTranslator from "./AuditEventTranslator"
import GeneralEventTranslator from "./GeneralEventTranslator"
import CourtResultInputTranslator from "./CourtResultInputTranslator"
import HearingOutcomePncUpdateTranslator from "./HearingOutcomePncUpdateTranslator"
import DataSetPncUpdateTranslator from "./DataSetPncUpdateTranslator"
import HearingOutcomeInputTranslator from "./HearingOutcomeInputTranslator"
import PncUpdateRequestTranslator from "./PncUpdateRequestTranslator"

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
