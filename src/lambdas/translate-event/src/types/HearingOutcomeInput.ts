export default interface HearingOutcomeInput {
  PNCUpdateDataset: {
    AnnotatedHearingOutcome: {
      HearingOutcome: {
        Hearing: {
          SourceReference: {
            UniqueID: string
          }
        }
      }
    }
  }
}
