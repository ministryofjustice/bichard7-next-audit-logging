import type { EventMessage, MessageFormat, AmazonMqEventSourceRecordEvent } from "shared"

type Result = {
  messages: EventMessage[]
}

export default (
  { messages, eventSourceArn }: AmazonMqEventSourceRecordEvent,
  messageFormat: MessageFormat
): Result => ({
  messages: messages.map((message) => ({
    messageData: message.data,
    messageFormat,
    messageType: message.messageType,
    eventSourceArn
  }))
})
