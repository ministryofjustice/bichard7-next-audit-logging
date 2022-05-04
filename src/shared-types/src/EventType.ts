enum EventType {
  SanitisedMessage = "Sanitised message",
  RecordArchived = "Record archived",
  TriggersGenerated = "Trigger generated",
  TriggerInstancesResolved = "Trigger Instances resolved",
  ExceptionsGenerated = "Hearing Outcome passed to Error List",
  AmendedAndResubmitted = "Amended Hearing Outcome Submitted",
  ExceptionsManuallyResolved = "Hearing Outcome marked as resolved by user",
  PncUpdated = "PNC Update applied successfully",
  RecordIgnored = "Hearing Outcome ignored as no offences are recordable", // No PNC update needed
  Retrying = "Retrying failed message"
}

export default EventType
