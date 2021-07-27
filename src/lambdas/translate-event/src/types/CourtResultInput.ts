export default interface CourtResultInput {
  DeliverRequest: {
    MessageIdentifier: string
    RequestingSystem: {
      Name: string
      OrgUnitCode: string
    }
    MessageMetadata: {
      OriginatingSystem: {
        Name: string
        OrgUnitCode: string
      }
      CreationDateTime: "2001-12-17T09:30:47-05:00"
    }
  }
}
