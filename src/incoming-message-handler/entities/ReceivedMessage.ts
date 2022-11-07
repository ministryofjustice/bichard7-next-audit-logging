export default interface ReceivedMessage {
  s3Path: string
  externalId: string
  stepExecutionId: string
  receivedDate: string
  messageXml: string
  hash?: string
}
