enum EventType {
  SanitisedMessage = "Sanitised message",
  ErrorRecordArchival = "Error record archival",
  TriggersGenerated = "Trigger generated",
  TriggerInstancesResolved = "Trigger Instances resolved",
  ExceptionsGenerated = "Hearing Outcome passed to Error List",
  AmendedAndResubmitted = "Amended Hearing Outcome Submitted",
  ExceptionsManuallyResolved = "Hearing Outcome marked as resolved by user",
  PncUpdated = "PNC Update applied successfully",
  RecordIgnoredNoRecordableOffences = "Hearing Outcome ignored as no offences are recordable",
  RecordIgnoredNoOffences = "Hearing Outcome ignored as it contains no offences",
  Retrying = "Retrying failed message",
  InputMessageReceived = "Input message received"
}

export default EventType
