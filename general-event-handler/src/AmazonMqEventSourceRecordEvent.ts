export default interface AmazonMqEventSourceRecordEvent {
  eventSource: string
  eventSourceArn: string
  messages: string[]
}
