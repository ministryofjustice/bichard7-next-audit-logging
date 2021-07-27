export default interface CourtResultInput {
  DeliverRequest: {
    MessageIdentifier: string
    MessageMetadata: {
      CreationDateTime: string
    }
  }
}
