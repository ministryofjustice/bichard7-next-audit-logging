export default interface PncUpdateRequest {
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
