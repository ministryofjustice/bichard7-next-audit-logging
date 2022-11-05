import type { AuditLogEvent } from "src/shared/types"
import { EventCode } from "src/shared/types"

const eventCodeLookup: { [k: string]: EventCode } = {
  "Trigger generated": EventCode.TriggersGenerated,
  "Trigger Instances resolved": EventCode.TriggersResolved,
  "Hearing Outcome marked as resolved by user": EventCode.ExceptionsResolved,
  "PNC Update applied successfully": EventCode.PncUpdated,
  "Hearing Outcome ignored as no offences are recordable": EventCode.IgnoredNonrecordable,
  "Hearing Outcome ignored as it contains no offences": EventCode.IgnoredNoOffences,
  "Re-opened / Statutory Declaration case ignored": EventCode.IgnoredReopened,
  "Interim hearing with ancillary only court results. PNC not updated": EventCode.IgnoredAncillary,
  "Hearing outcome ignored - PNC update is not enabled for this court": EventCode.IgnoredDisabled,
  "Hearing outcome ignored - Appeal result did not amend disposal": EventCode.IgnoredAppeal,
  "Message Rejected by [CourtResultBean] MDB": EventCode.MessageRejected,
  "Message Rejected by [AmendedHearingOutcomeBean] MDB": EventCode.MessageRejected,
  "Message Rejected by [PNCUpdateProcessorBean] MDB": EventCode.MessageRejected,
  "Message Rejected by [PNCUpdateChoreographyDSBean] MDB": EventCode.MessageRejected,
  "Message Rejected by [PNCUpdateChoreographyHOBean] MDB": EventCode.MessageRejected,
  "Retrying failed message": EventCode.RetryingMessage,
  "Error record archival": EventCode.ErrorRecordArchived,
  "Input message received": EventCode.HearingOutcomeDetails,
  "Hearing Outcome passed to Error List": EventCode.ExceptionsGenerated,
  "Sanitised message": EventCode.Sanitised,
  "PNC Response received": EventCode.PncResponseReceived,
  "PNC Response not received": EventCode.PncResponseNotReceived,
  "PNC Update added to Error List (Unexpected PNC response)": EventCode.ExceptionsGenerated,
  "PNC Update added to Error List (PNC message construction)": EventCode.ExceptionsGenerated
}

const transformAuditLogEvent = (event: AuditLogEvent): AuditLogEvent => {
  if (event.attributes?.eventCode && typeof event.attributes.eventCode === "string") {
    event.eventCode = event.attributes.eventCode
    delete event.attributes.eventCode
  }

  if (!event.eventCode) {
    event.eventCode = eventCodeLookup[event.eventType]
  }

  const user = event.attributes?.user ?? event.attributes?.User
  if (typeof user === "string") {
    event.user = user
    delete event.attributes.user
    delete event.attributes.User
  }

  return event
}

export default transformAuditLogEvent
