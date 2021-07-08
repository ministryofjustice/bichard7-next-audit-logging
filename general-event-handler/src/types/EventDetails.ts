export default interface EventDetails {
  systemID: string
  componentID: string
  eventCategory: string
  eventType: string
  correlationID: string
  eventDateTime: string
  nameValuePairs?: {
    nameValuePair?: {
      name: string
      value: string
    }[]
  }
}