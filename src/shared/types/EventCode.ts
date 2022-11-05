enum EventCode {
  TriggersGenerated = "triggers.generated",
  TriggersResolved = "triggers.resolved",
  ExceptionsResolved = "exceptions.resolved",
  PncUpdated = "pnc.updated",
  IgnoredNonrecordable = "hearing-outcome.ignored.nonrecordable",
  IgnoredNoOffences = "hearing-outcome.ignored.no-offences",
  IgnoredReopened = "hearing-outcome.ignored.reopened",
  IgnoredAncillary = "hearing-outcome.ignored.ancillary",
  IgnoredDisabled = "hearing-outcome.ignored.court-disabled",
  IgnoredAppeal = "hearing-outcome.ignored.appeal",
  MessageRejected = "message-rejected",
  RetryingMessage = "hearing-outcome-retrying",
  ErrorRecordArchived = "error-record.archived",
  ExceptionsGenerated = "exceptions.generated",
  Sanitised = "sanitised",
  HearingOutcomeDetails = "hearing-outcome.details",
  PncResponseReceived = "pnc.response-received",
  PncResponseNotReceived = "pnc.response-not-received"
}

export default EventCode
