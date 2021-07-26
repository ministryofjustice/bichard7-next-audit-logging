export default interface CourtResultInput {
  DeliverRequest: {
    MessageIdentifier: string
    RequestingSystem: {
      Name: string
      OrgUnitCode: string
      Environment: string
    }
    AckRequested: string
    MessageMetadata: {
      OriginatingSystem: {
        Name: string
        OrgUnitCode: string
        Environment: string
      }
      CreationDateTime: "2001-12-17T09:30:47-05:00"
      ExpiryDateTime: "2031-12-17T09:30:47-05:00"
      SenderRequestedDestination: string
    }
  }
}