export default interface JmsTextMessage {
  messageID: string
  messageType: string
  data: string
  destination: {
    physicalName: string
  }
}
