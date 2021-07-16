import type JmsTextMessage from "./JmsTextMessage"

export default interface AmazonMqEventSourceRecordEvent {
  eventSource: string
  eventSourceArn: string
  messages: JmsTextMessage[]
}
