enum EventType {
  SanitisedMessage = "Sanitised message",
  RecordArchived = "Record archived",
  TriggersGenerated = "Trigger generated",
  TriggerInstancesResolved = "Trigger Instances resolved",
  ExceptionsGenerated = "Hearing Outcome passed to Error List",
  AmendedAndResubmitted = "Amended Hearing Outcome Submitted",
  ExceptionsManuallyResolved = "Hearing Outcome marked as resolved by user",
  PncUpdated = "PNC Update applied successfully",
  RecordIgnoredNoRecordableOffences = "Hearing Outcome ignored as no offences are recordable",
  RecordIgnoredNoOffences = "Hearing Outcome ignored as it contains no offences",
  Retrying = "Retrying failed message"
}

export default EventType
